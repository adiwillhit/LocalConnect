import { userService } from '../services/user.service.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.params.id);
  return sendResponse(res, 200, 'User profile fetched successfully', user);
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  return sendResponse(res, 200, 'Profile updated successfully', user);
});

export const updateMyLocation = asyncHandler(async (req, res) => {
  const user = await userService.updateLocation(req.user._id, req.body.location);
  return sendResponse(res, 200, 'Location updated successfully', user);
});

export const followUser = asyncHandler(async (req, res) => {
  const result = await userService.followUser(req.user._id, req.params.id);
  return sendResponse(res, 200, 'User followed successfully', result);
});

export const unfollowUser = asyncHandler(async (req, res) => {
  const result = await userService.unfollowUser(req.user._id, req.params.id);
  return sendResponse(res, 200, 'User unfollowed successfully', result);
});

export const getFollowers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const { followers, meta } = await userService.getFollowers(req.params.id, { page, limit });
  return sendResponse(res, 200, 'Followers fetched successfully', followers, meta);
});

export const getFollowing = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const { following, meta } = await userService.getFollowing(req.params.id, { page, limit });
  return sendResponse(res, 200, 'Following fetched successfully', following, meta);
});

export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStats(req.params.id);
  return sendResponse(res, 200, 'User statistics fetched successfully', stats);
});

