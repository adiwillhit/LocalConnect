import { communityService } from '../services/community.service.js';
import { postService } from '../services/post.service.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createCommunity = asyncHandler(async (req, res) => {
  const community = await communityService.createCommunity(req.user._id, req.body);
  return sendResponse(res, 201, 'Community created successfully', community);
});

export const getCommunities = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const { search, location } = req.query;

  const { communities, meta } = await communityService.getCommunities({
    search,
    location,
    page,
    limit,
  });

  return sendResponse(res, 200, 'Communities fetched successfully', communities, meta);
});

export const getCommunityById = asyncHandler(async (req, res) => {
  const { community } = await communityService.getCommunityById(req.params.id);
  return sendResponse(res, 200, 'Community fetched successfully', community);
});

export const updateCommunity = asyncHandler(async (req, res) => {
  const community = await communityService.updateCommunity(
    req.params.id,
    req.user._id,
    req.user.role,
    req.body
  );
  return sendResponse(res, 200, 'Community updated successfully', community);
});

export const joinCommunity = asyncHandler(async (req, res) => {
  const community = await communityService.joinCommunity(req.params.id, req.user._id);
  return sendResponse(res, 200, 'Joined community successfully', community);
});

export const leaveCommunity = asyncHandler(async (req, res) => {
  const community = await communityService.leaveCommunity(req.params.id, req.user._id);
  return sendResponse(res, 200, 'Left community successfully', community);
});

export const getCommunityMembers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const { members, meta } = await communityService.getCommunityMembers(req.params.id, {
    page,
    limit,
  });
  return sendResponse(res, 200, 'Community members fetched successfully', members, meta);
});

export const getCommunityPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const { posts, meta } = await postService.getPosts({
    communityId: req.params.id,
    category: req.query.category,
    page,
    limit,
  });
  return sendResponse(res, 200, 'Community posts fetched successfully', posts, meta);
});

export const deleteCommunity = asyncHandler(async (req, res) => {
  const result = await communityService.deleteCommunity(
    req.params.id,
    req.user._id,
    req.user.role
  );
  return sendResponse(res, 200, 'Community deleted successfully', result);
});

