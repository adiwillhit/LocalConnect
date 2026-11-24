import { env } from '../config/environment.js';
import { enqueuePostNotification } from '../jobs/notification.worker.js';
import { Comment } from '../models/Comment.js';
import { Community } from '../models/Community.js';
import { POST_CATEGORIES, Post } from '../models/Post.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { cacheKeys } from '../utils/cacheKeys.js';
import { cacheService } from './cache.service.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeCategory = (category) => {
  if (!category) return undefined;
  return POST_CATEGORIES.find((c) => c.toLowerCase() === category.toLowerCase());
};

const invalidatePostCaches = async (communityId) => {
  const tasks = [
    cacheService.delByPattern(cacheKeys.globalFeedPattern()),
    cacheService.delByPattern(cacheKeys.popularPostsPattern()),
  ];
  if (communityId) {
    tasks.push(cacheService.delByPattern(cacheKeys.communityFeedPattern(communityId.toString())));
  }
  await Promise.all(tasks);
};

export const postService = {
  async createPost(userId, { communityId, title, content, category = 'General' }) {
    const community = await Community.findById(communityId).select('name location').lean();
    if (!community) {
      throw new ApiError(404, 'Community not found');
    }

    const post = await Post.create({
      userId,
      communityId,
      title,
      content,
      category,
      location: community.location,
    });

    await invalidatePostCaches(communityId);
    await enqueuePostNotification({
      postId: post._id,
      communityId,
      authorId: userId,
      title: post.title,
    });

    return post.toJSON();
  },

  async getPosts({ search, category, communityId, userId, page = 1, limit = 10 }) {
    const filter = {};

    if (communityId) {
      filter.communityId = communityId;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (category) {
      const matchedCategory = normalizeCategory(category);
      if (!matchedCategory) {
        throw new ApiError(400, `Invalid category: ${category}`);
      }
      filter.category = matchedCategory;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ title: regex }, { content: regex }];
    }

    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      Post.find(filter)
        .select('-__v')
        .populate('userId', 'name location')
        .populate('communityId', 'name location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      posts,
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

  async getPopularPosts(limit = 10) {
    const cacheKey = cacheKeys.popularPosts(limit);
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return { posts: cached, cacheHit: true };
    }

    const posts = await Post.find({})
      .select('-__v')
      .populate('userId', 'name location')
      .populate('communityId', 'name location')
      .sort({ likesCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    await cacheService.set(cacheKey, posts, env.cacheTtl.popularPosts);
    return { posts, cacheHit: false };
  },

  async getPostById(postId) {
    const post = await Post.findById(postId)
      .select('-__v')
      .populate('userId', 'name location')
      .populate('communityId', 'name location')
      .lean();

    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    return post;
  },

  async updatePost(postId, userId, userRole, updates) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    const isOwner = post.userId.toString() === userId.toString();
    if (!isOwner && userRole !== 'ADMIN') {
      throw new ApiError(403, 'Not authorized to update this post');
    }

    if (updates.title !== undefined) post.title = updates.title;
    if (updates.content !== undefined) post.content = updates.content;
    if (updates.category !== undefined) post.category = updates.category;

    await post.save();
    await invalidatePostCaches(post.communityId);

    return post.toJSON();
  },

  async deletePost(postId, userId, userRole) {
    const post = await Post.findById(postId);
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    const isOwner = post.userId.toString() === userId.toString();
    if (!isOwner && userRole !== 'ADMIN') {
      throw new ApiError(403, 'Not authorized to delete this post');
    }

    await Promise.all([
      Comment.deleteMany({ postId }),
      Post.deleteOne({ _id: postId }),
    ]);

    await invalidatePostCaches(post.communityId);
    return { deletedPostId: postId };
  },

  async likePost(postId, userId) {
    const exists = await Post.exists({ _id: postId });
    if (!exists) {
      throw new ApiError(404, 'Post not found');
    }

    const updated = await Post.findOneAndUpdate(
      { _id: postId, likes: { $ne: userId } },
      { $addToSet: { likes: userId }, $inc: { likesCount: 1 } },
      { new: true }
    )
      .select('_id communityId likesCount')
      .lean();

    if (!updated) {
      throw new ApiError(409, 'You have already liked this post');
    }

    await invalidatePostCaches(updated.communityId);
    return { postId: updated._id, likesCount: updated.likesCount };
  },

  async unlikePost(postId, userId) {
    const exists = await Post.exists({ _id: postId });
    if (!exists) {
      throw new ApiError(404, 'Post not found');
    }

    const updated = await Post.findOneAndUpdate(
      { _id: postId, likes: userId },
      { $pull: { likes: userId }, $inc: { likesCount: -1 } },
      { new: true }
    )
      .select('_id communityId likesCount')
      .lean();

    if (!updated) {
      throw new ApiError(400, 'You have not liked this post');
    }

    await invalidatePostCaches(updated.communityId);
    return { postId: updated._id, likesCount: updated.likesCount };
  },

  async getPostLikes(postId, { page = 1, limit = 20 }) {
    const post = await Post.findById(postId).select('likes likesCount').lean();
    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    const total = post.likes.length;
    const skip = (page - 1) * limit;
    const userIds = post.likes.slice(skip, skip + limit);

    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } })
          .select('name location bio')
          .lean()
      : [];

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      likes: users,
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
};

