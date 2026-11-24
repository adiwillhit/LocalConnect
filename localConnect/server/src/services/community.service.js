import { env } from '../config/environment.js';
import { Comment } from '../models/Comment.js';
import { Community } from '../models/Community.js';
import { Post } from '../models/Post.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { cacheKeys } from '../utils/cacheKeys.js';
import { cacheService } from './cache.service.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const communityService = {
  async createCommunity(userId, { name, description, location }) {
    const community = await Community.create({
      name,
      description,
      location,
      createdBy: userId,
      members: [userId],
      membersCount: 1,
    });

    await User.updateOne(
      { _id: userId },
      { $addToSet: { joinedCommunities: community._id } }
    );

    await cacheService.delByPattern(cacheKeys.communityListPattern());

    return community.toJSON();
  },

  async getCommunities({ search, location, page = 1, limit = 10 }) {
    const cacheKey = cacheKeys.communityList({ search, location, page, limit });
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return { ...cached, cacheHit: true };
    }

    const filter = {};
    if (location) {
      filter.location = new RegExp(escapeRegex(location), 'i');
    }
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;
    const [communities, total] = await Promise.all([
      Community.find(filter)
        .select('name description location createdBy membersCount createdAt')
        .sort({ membersCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Community.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const result = {
      communities,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };

    await cacheService.set(cacheKey, result, env.cacheTtl.community);
    return { ...result, cacheHit: false };
  },

  async getCommunityById(communityId) {
    const cacheKey = cacheKeys.communityById(communityId);
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return { community: cached, cacheHit: true };
    }

    const community = await Community.findById(communityId)
      .populate('createdBy', 'name location')
      .select('-__v')
      .lean();

    if (!community) {
      throw new ApiError(404, 'Community not found');
    }

    await cacheService.set(cacheKey, community, env.cacheTtl.community);
    return { community, cacheHit: false };
  },

  async updateCommunity(communityId, userId, userRole, updates) {
    const community = await Community.findById(communityId);
    if (!community) {
      throw new ApiError(404, 'Community not found');
    }

    const isOwner = community.createdBy.toString() === userId.toString();
    if (!isOwner && userRole !== 'ADMIN') {
      throw new ApiError(403, 'Not authorized to update this community');
    }

    if (updates.name !== undefined) community.name = updates.name;
    if (updates.description !== undefined) community.description = updates.description;
    if (updates.location !== undefined) community.location = updates.location;

    await community.save();

    await Promise.all([
      cacheService.del(cacheKeys.communityById(communityId)),
      cacheService.delByPattern(cacheKeys.communityListPattern()),
      cacheService.delByPattern(cacheKeys.communityFeedPattern(communityId)),
    ]);

    return community.toJSON();
  },

  async joinCommunity(communityId, userId) {
    const exists = await Community.exists({ _id: communityId });
    if (!exists) {
      throw new ApiError(404, 'Community not found');
    }

    const updated = await Community.findOneAndUpdate(
      { _id: communityId, members: { $ne: userId } },
      { $addToSet: { members: userId }, $inc: { membersCount: 1 } },
      { new: true }
    )
      .select('name location membersCount')
      .lean();

    if (!updated) {
      throw new ApiError(409, 'You are already a member of this community');
    }

    await User.updateOne(
      { _id: userId },
      { $addToSet: { joinedCommunities: communityId } }
    );

    await Promise.all([
      cacheService.del(cacheKeys.communityById(communityId)),
      cacheService.delByPattern(cacheKeys.communityListPattern()),
      cacheService.delByPattern(cacheKeys.communityFeedPattern(communityId)),
    ]);

    return updated;
  },

  async leaveCommunity(communityId, userId) {
    const exists = await Community.exists({ _id: communityId });
    if (!exists) {
      throw new ApiError(404, 'Community not found');
    }

    const updated = await Community.findOneAndUpdate(
      { _id: communityId, members: userId },
      { $pull: { members: userId }, $inc: { membersCount: -1 } },
      { new: true }
    )
      .select('name location membersCount')
      .lean();

    if (!updated) {
      throw new ApiError(400, 'You are not a member of this community');
    }

    await User.updateOne(
      { _id: userId },
      { $pull: { joinedCommunities: communityId } }
    );

    await Promise.all([
      cacheService.del(cacheKeys.communityById(communityId)),
      cacheService.delByPattern(cacheKeys.communityListPattern()),
      cacheService.delByPattern(cacheKeys.communityFeedPattern(communityId)),
    ]);

    return updated;
  },

  async getCommunityMembers(communityId, { page = 1, limit = 20 }) {
    const community = await Community.findById(communityId).select('members').lean();
    if (!community) {
      throw new ApiError(404, 'Community not found');
    }

    const total = community.members.length;
    const skip = (page - 1) * limit;
    const memberIds = community.members.slice(skip, skip + limit);

    const members = memberIds.length
      ? await User.find({ _id: { $in: memberIds } })
          .select('name location bio')
          .lean()
      : [];

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      members,
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

  async deleteCommunity(communityId, userId, userRole) {
    const community = await Community.findById(communityId);
    if (!community) {
      throw new ApiError(404, 'Community not found');
    }

    const isOwner = community.createdBy.toString() === userId.toString();
    if (!isOwner && userRole !== 'ADMIN') {
      throw new ApiError(403, 'Not authorized to delete this community');
    }

    const postIds = await Post.find({ communityId }).distinct('_id');
    await Promise.all([
      Comment.deleteMany({ postId: { $in: postIds } }),
      Post.deleteMany({ communityId }),
      User.updateMany(
        { joinedCommunities: communityId },
        { $pull: { joinedCommunities: communityId } }
      ),
      Community.deleteOne({ _id: communityId }),
    ]);

    await Promise.all([
      cacheService.del(cacheKeys.communityById(communityId)),
      cacheService.delByPattern(cacheKeys.communityListPattern()),
      cacheService.delByPattern(cacheKeys.communityFeedPattern(communityId)),
      cacheService.delByPattern(cacheKeys.globalFeedPattern()),
      cacheService.delByPattern(cacheKeys.popularPostsPattern()),
    ]);

    return { deletedCommunityId: communityId };
  },
};

