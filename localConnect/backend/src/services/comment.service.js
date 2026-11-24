import { Comment } from '../models/Comment.js';
import { Post } from '../models/Post.js';
import { ApiError } from '../utils/ApiError.js';

export const commentService = {
  async addComment(postId, userId, { content }) {
    const post = await Post.findById(postId).select('_id').lean();
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    const comment = await Comment.create({
      postId,
      userId,
      content,
    });

    await Post.updateOne({ _id: postId }, { $inc: { commentsCount: 1 } });

    return comment.toJSON();
  },

  async getCommentsByPost(postId, { page = 1, limit = 20 }) {
    const postExists = await Post.exists({ _id: postId });
    if (!postExists) {
      throw new ApiError(404, 'Post not found');
    }

    const skip = (page - 1) * limit;
    const [comments, total] = await Promise.all([
      Comment.find({ postId })
        .select('-__v')
        .populate('userId', 'name location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ postId }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      comments,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  },

  async updateComment(commentId, userId, userRole, { content }) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, 'Comment not found');
    }

    const postExists = await Post.exists({ _id: comment.postId });
    if (!postExists) {
      throw new ApiError(404, 'Parent post no longer exists');
    }

    const isOwner = comment.userId.toString() === userId.toString();
    if (!isOwner && userRole !== 'ADMIN') {
      throw new ApiError(403, 'Not authorized to update this comment');
    }

    comment.content = content;
    await comment.save();

    return comment.toJSON();
  },

  async deleteComment(commentId, userId, userRole) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, 'Comment not found');
    }

    const isOwner = comment.userId.toString() === userId.toString();
    if (!isOwner && userRole !== 'ADMIN') {
      throw new ApiError(403, 'Not authorized to delete this comment');
    }

    await Promise.all([
      Comment.deleteOne({ _id: commentId }),
      Post.updateOne(
        { _id: comment.postId, commentsCount: { $gt: 0 } },
        { $inc: { commentsCount: -1 } }
      ),
    ]);

    return { deletedCommentId: commentId };
  },
};

