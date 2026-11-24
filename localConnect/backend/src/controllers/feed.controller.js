import { feedService } from '../services/feed.service.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getFeed = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const { category, communityId, location, sort = 'latest', personalized } = req.query;

  const { posts, meta, cacheHit } = await feedService.getFeed({
    user: req.user || null,
    page,
    limit,
    category,
    communityId,
    location,
    sort,
    personalized,
  });

  res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');
  return sendResponse(res, 200, 'Feed fetched successfully', posts, meta);
});

