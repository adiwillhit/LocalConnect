import { commentService } from '../services/comment.service.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const addComment = asyncHandler(async (req, res) => {
  const comment = await commentService.addComment(req.params.postId, req.user._id, req.body);
  return sendResponse(res, 201, 'Comment added successfully', comment);
});

export const getCommentsByPost = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const { comments, meta } = await commentService.getCommentsByPost(req.params.postId, {
    page,
    limit,
  });
  return sendResponse(res, 200, 'Comments fetched successfully', comments, meta);
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await commentService.updateComment(
    req.params.id,
    req.user._id,
    req.user.role,
    req.body
  );
  return sendResponse(res, 200, 'Comment updated successfully', comment);
});

export const deleteComment = asyncHandler(async (req, res) => {
  const result = await commentService.deleteComment(
    req.params.id,
    req.user._id,
    req.user.role
  );
  return sendResponse(res, 200, 'Comment deleted successfully', result);
});

