import { jest } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { cacheService } from '../src/services/cache.service.js';

const app = createApp();

const seedPosts = async () => {
  const regRes = await request(app).post('/api/auth/register').send({
    name: 'Feed Author',
    email: 'feedauthor@example.com',
    password: 'Password123!',
    location: 'Jammu',
  });
  const token = regRes.body.data.accessToken;

  const commRes = await request(app)
    .post('/api/communities')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Jammu Community',
      description: 'Local Jammu updates',
      location: 'Jammu',
    });
  const communityId = commRes.body.data._id;

  const post1 = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      communityId,
      title: 'Scholarship Opportunity',
      content: 'New engineering scholarships open.',
      category: 'Education',
    });

  const post2 = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      communityId,
      title: 'Local Startup Hiring',
      content: 'Backend intern needed.',
      category: 'Jobs',
    });

  const post3 = await request(app)
    .post('/api/posts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      communityId,
      title: 'Weekend Book Fair',
      content: 'Come visit the central library.',
      category: 'Education',
    });

  // Like post1 so popular sorting can be verified
  await request(app)
    .post(`/api/posts/${post1.body.data._id}/like`)
    .set('Authorization', `Bearer ${token}`);

  return { token, communityId, postIds: [post1.body.data._id, post2.body.data._id, post3.body.data._id] };
};

describe('Feed API & Caching', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should support pagination, category filtering, and sorting', async () => {
    await seedPosts();

    // Pagination
    const page1 = await request(app).get('/api/feed?page=1&limit=2');
    expect(page1.status).toBe(200);
    expect(page1.body.data.length).toBe(2);
    expect(page1.body.meta.totalResults).toBe(3);
    expect(page1.body.meta.totalPages).toBe(2);
    expect(page1.body.meta.hasNextPage).toBe(true);
    expect(page1.body.meta.hasPreviousPage).toBe(false);

    // Category filter (case-insensitive)
    const eduFeed = await request(app).get('/api/feed?category=education');
    expect(eduFeed.status).toBe(200);
    expect(eduFeed.body.data.length).toBe(2);

    // Popular sort
    const popularFeed = await request(app).get('/api/feed?sort=popular');
    expect(popularFeed.status).toBe(200);
    expect(popularFeed.body.data[0].title).toBe('Scholarship Opportunity');
    expect(popularFeed.body.data[0].likesCount).toBe(1);
  });

  it('should handle cache miss, cache hit, and cache invalidation on post creation', async () => {
    const { token, communityId } = await seedPosts();

    const memoryStore = new Map();
    const getSpy = jest.spyOn(cacheService, 'get').mockImplementation(async (key) => {
      return memoryStore.has(key) ? memoryStore.get(key) : null;
    });
    const setSpy = jest.spyOn(cacheService, 'set').mockImplementation(async (key, val) => {
      memoryStore.set(key, val);
      return true;
    });
    const delPatternSpy = jest
      .spyOn(cacheService, 'delByPattern')
      .mockImplementation(async (pattern) => {
        const prefix = pattern.replace('*', '');
        for (const k of memoryStore.keys()) {
          if (k.startsWith(prefix)) {
            memoryStore.delete(k);
          }
        }
        return true;
      });

    // First request -> Cache MISS
    const firstRes = await request(app).get(`/api/feed?communityId=${communityId}&page=1&limit=10`);
    expect(firstRes.status).toBe(200);
    expect(firstRes.headers['x-cache']).toBe('MISS');
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenCalledTimes(1);

    // Second request -> Cache HIT
    const secondRes = await request(app).get(`/api/feed?communityId=${communityId}&page=1&limit=10`);
    expect(secondRes.status).toBe(200);
    expect(secondRes.headers['x-cache']).toBe('HIT');
    expect(secondRes.body.data.length).toBe(3);

    // Create a new post -> invalidates community feed cache
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        communityId,
        title: 'Fresh Post After Cache',
        content: 'Should invalidate cached feed.',
        category: 'News',
      });

    expect(delPatternSpy).toHaveBeenCalled();

    // Third request -> Cache MISS with updated count (4 posts)
    const thirdRes = await request(app).get(`/api/feed?communityId=${communityId}&page=1&limit=10`);
    expect(thirdRes.status).toBe(200);
    expect(thirdRes.headers['x-cache']).toBe('MISS');
    expect(thirdRes.body.data.length).toBe(4);
  });
});

