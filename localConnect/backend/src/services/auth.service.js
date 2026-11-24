import bcrypt from 'bcrypt';
import { RefreshToken } from '../models/RefreshToken.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from '../utils/generateToken.js';

const BCRYPT_SALT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const sanitizeUser = (userDoc) => {
  const userObj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};

const issueTokenPair = async (user) => {
  const payload = { userId: user._id.toString(), role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { accessToken, refreshToken };
};

export const authService = {
  async register({ name, email, password, location, bio = '' }) {
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      throw new ApiError(409, 'Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      location,
      bio,
      role: 'USER',
    });

    const tokens = await issueTokenPair(user);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  },

  async login({ email, password }) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const tokens = await issueTokenPair(user);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  },

  async refreshToken(refreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshToken);
    const storedToken = await RefreshToken.findOne({ tokenHash });

    if (!storedToken) {
      throw new ApiError(401, 'Refresh token not recognized');
    }

    if (storedToken.revokedAt) {
      // Reuse detection: revoke all active refresh tokens for this user
      await RefreshToken.updateMany(
        { userId: storedToken.userId, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
      throw new ApiError(401, 'Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new ApiError(401, 'Refresh token expired');
    }

    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      throw new ApiError(401, 'User no longer exists');
    }

    const payload = { userId: user._id.toString(), role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    const newRefreshHash = hashToken(newRefreshToken);

    storedToken.revokedAt = new Date();
    storedToken.replacedByTokenHash = newRefreshHash;
    await storedToken.save();

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newRefreshHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  async logout(refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await RefreshToken.findOneAndUpdate(
      { tokenHash, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    return { loggedOut: true };
  },

  async getMe(userId) {
    const user = await User.findById(userId)
      .select('-password')
      .populate('joinedCommunities', 'name location')
      .lean();

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user;
  },
};

