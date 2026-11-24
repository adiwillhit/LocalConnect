import { env } from '../config/environment.js';
import { POST_CATEGORIES, Post } from '../models/Post.js';
import { ApiError } from '../utils/ApiError.js';
import { cacheKeys } from '../utils/cacheKeys.js';
import { cacheService } from './cache.service.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeCategory = (category) => {
  if (!category) return undefined;
  return POST_CATEGORIES.find((c) => c.toLowerCase() === category.toLowerCase());
};

const getSortOption = (sort) => {
  switch (sort) {
    case 'popular':
      return { likesCount: -1, createdAt: -1 };
    case 'oldest':
      return { createdAt: 1 };
    case 'latest':
    default:
      return { createdAt: -1 };
  }
};

export const feedService = {
  async getFeed({
    user = null,
    page = 1,
    limit = 10,
    category,
    communityId,
    location,
    sort = 'latest',
    personalized,
  }) {
    const usePersonalized =
      Boolean(user) &&
      personalized !== 'false' &&
      !communityId &&
      !location;

    const querySignature = { page, limit, category, communityId, location, sort };
    let cacheKey = null;

    if (communityId && !usePersonalized) {
      cacheKey = cacheKeys.communityFeed(communityId, querySignature);
    } else if (!usePersonalized) {
      cacheKey = cacheKeys.globalFeed(querySignature);
    }

    if (cacheKey) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return { ...cached, cacheHit: true };
      }
    }

    const filter = {};

    if (category) {
      const matchedCategory = normalizeCategory(category);
      if (!matchedCategory) {
        throw new ApiError(400, `Invalid category: ${category}`);
      }
      filter.category = matchedCategory;
    }

    if (communityId) {
      filter.communityId = communityId;
    }

    if (location) {
      filter.location = new RegExp(escapeRegex(location), 'i');
    }

    if (usePersonalized) {
      const joinedCommunities = user.joinedCommunities || [];
      const following = user.following || [];
      const orClauses = [];

      if (joinedCommunities.length > 0) {
        orClauses.push({ communityId: { $in: joinedCommunities } });
      }
      if (following.length > 0) {
        orClauses.push({ userId: { $in: following } });
      }

      if (orClauses.length > 0) {
        filter.$or = orClauses;
      } else if (user.location) {
        filter.location = new RegExp(escapeRegex(user.location), 'i');
      }
    }

    const sortOption = getSortOption(sort);
    const skip = (page - 1) * limit;

    const [posts, totalResults] = await Promise.all([
      Post.find(filter)
        .select('-__v')
        .populate('userId', 'name location')
        .populate('communityId', 'name location')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalResults / limit) || 1;
    const result = {
      posts,
      meta: {
        page,
        limit,
        totalResults,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };

    if (cacheKey) {
      await cacheService.set(cacheKey, result, env.cacheTtl.feed);
    }

    return { ...result, cacheHit: false };
  },
};

