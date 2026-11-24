import { postService } from '../services/post.service.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createPost = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.user._id, req.body);
  return sendResponse(res, 201, 'Post created successfully', post);
});

export const getPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const { search, category, communityId } = req.query;

  const { posts, meta } = await postService.getPosts({
    search,
    category,
    communityId,
    page,
    limit,
  });
  return sendResponse(res, 200, 'Posts fetched successfully', posts, meta);
});

export const getPopularPosts = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const { posts } = await postService.getPopularPosts(limit);
  return sendResponse(res, 200, 'Popular posts fetched successfully', posts);
});

export const getPostById = asyncHandler(async (req, res) => {
  const post = await postService.getPostById(req.params.id);
  return sendResponse(res, 200, 'Post fetched successfully', post);
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await postService.updatePost(
    req.params.id,
    req.user._id,
    req.user.role,
    req.body
  );
  return sendResponse(res, 200, 'Post updated successfully', post);
});

export const deletePost = asyncHandler(async (req, res) => {
  const result = await postService.deletePost(req.params.id, req.user._id, req.user.role);
  return sendResponse(res, 200, 'Post deleted successfully', result);
});

export const likePost = asyncHandler(async (req, res) => {
  const result = await postService.likePost(req.params.id, req.user._id);
  return sendResponse(res, 200, 'Post liked successfully', result);
});

export const unlikePost = asyncHandler(async (req, res) => {
  const result = await postService.unlikePost(req.params.id, req.user._id);
  return sendResponse(res, 200, 'Post unliked successfully', result);
});

export const getPostLikes = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const { likes, meta } = await postService.getPostLikes(req.params.id, { page, limit });
  return sendResponse(res, 200, 'Post likes fetched successfully', likes, meta);
});

