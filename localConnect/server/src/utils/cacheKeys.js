import crypto from 'crypto';

const hashParams = (params) => {
  const normalized = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      if (params[key] !== undefined && params[key] !== '') {
        acc[key] = params[key];
      }
      return acc;
    }, {});
  return crypto.createHash('md5').update(JSON.stringify(normalized)).digest('hex');
};

export const cacheKeys = {
  communityById: (communityId) => `community:${communityId}`,
  communityList: (query) => `communities:list:${hashParams(query)}`,
  communityListPattern: () => 'communities:list:*',

  communityFeed: (communityId, query) => `feed:community:${communityId}:${hashParams(query)}`,
  communityFeedPattern: (communityId) => `feed:community:${communityId}:*`,

  globalFeed: (query) => `feed:global:${hashParams(query)}`,
  globalFeedPattern: () => 'feed:global:*',

  popularPosts: (limit = 10) => `posts:popular:${limit}`,
  popularPostsPattern: () => 'posts:popular:*',
};

