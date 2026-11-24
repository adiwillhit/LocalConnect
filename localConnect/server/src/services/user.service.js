import { Post } from '../models/Post.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export const userService = {
  async getProfile(userId) {
    const user = await User.findById(userId)
      .select('-password -__v')
      .populate('joinedCommunities', 'name location')
      .lean();

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return {
      ...user,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
    };
  },

  async updateProfile(userId, updates) {
    const allowedUpdates = {};
    if (updates.name !== undefined) allowedUpdates.name = updates.name;
    if (updates.bio !== undefined) allowedUpdates.bio = updates.bio;
    if (updates.location !== undefined) allowedUpdates.location = updates.location;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    )
      .select('-password -__v')
      .lean();

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user;
  },

  async updateLocation(userId, location) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { location } },
      { new: true, runValidators: true }
    )
      .select('-password -__v')
      .lean();

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user;
  },

  async followUser(currentUserId, targetUserId) {
    if (currentUserId.toString() === targetUserId.toString()) {
      throw new ApiError(400, 'You cannot follow yourself');
    }

    const targetUser = await User.findById(targetUserId).select('_id').lean();
    if (!targetUser) {
      throw new ApiError(404, 'Target user not found');
    }

    const updatedCurrent = await User.findOneAndUpdate(
      { _id: currentUserId, following: { $ne: targetUserId } },
      { $addToSet: { following: targetUserId } },
      { new: true }
    )
      .select('_id')
      .lean();

    if (!updatedCurrent) {
      throw new ApiError(409, 'You are already following this user');
    }

    await User.updateOne(
      { _id: targetUserId },
      { $addToSet: { followers: currentUserId } }
    );

    return { followedUserId: targetUserId };
  },

  async unfollowUser(currentUserId, targetUserId) {
    if (currentUserId.toString() === targetUserId.toString()) {
      throw new ApiError(400, 'You cannot unfollow yourself');
    }

    const targetUser = await User.findById(targetUserId).select('_id').lean();
    if (!targetUser) {
      throw new ApiError(404, 'Target user not found');
    }

    const updatedCurrent = await User.findOneAndUpdate(
      { _id: currentUserId, following: targetUserId },
      { $pull: { following: targetUserId } },
      { new: true }
    )
      .select('_id')
      .lean();

    if (!updatedCurrent) {
      throw new ApiError(400, 'You are not following this user');
    }

    await User.updateOne(
      { _id: targetUserId },
      { $pull: { followers: currentUserId } }
    );

    return { unfollowedUserId: targetUserId };
  },

  async getFollowers(userId, { page = 1, limit = 20 }) {
    const user = await User.findById(userId).select('followers').lean();
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const total = user.followers.length;
    const skip = (page - 1) * limit;
    const followerIds = user.followers.slice(skip, skip + limit);

    const followers = followerIds.length
      ? await User.find({ _id: { $in: followerIds } })
          .select('name email location bio')
          .lean()
      : [];

    return {
      followers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getFollowing(userId, { page = 1, limit = 20 }) {
    const user = await User.findById(userId).select('following').lean();
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const total = user.following.length;
    const skip = (page - 1) * limit;
    const followingIds = user.following.slice(skip, skip + limit);

    const following = followingIds.length
      ? await User.find({ _id: { $in: followingIds } })
          .select('name email location bio')
          .lean()
      : [];

    return {
      following,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getUserStats(userId) {
    const user = await User.findById(userId)
      .select('name location followers following joinedCommunities createdAt')
      .lean();

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const [postsCount, likesAgg] = await Promise.all([
      Post.countDocuments({ userId }),
      Post.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, totalLikes: { $sum: '$likesCount' } } },
      ]),
    ]);

    return {
      userId: user._id,
      name: user.name,
      location: user.location,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      joinedCommunitiesCount: user.joinedCommunities?.length || 0,
      postsCount,
      totalLikesReceived: likesAgg[0]?.totalLikes || 0,
      memberSince: user.createdAt,
    };
  },
};

