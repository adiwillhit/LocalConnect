import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

const setupUserAndCommunity = async (emailSuffix = '1') => {
  const regRes = await request(app).post('/api/auth/register').send({
    name: `User ${emailSuffix}`,
    email: `postuser${emailSuffix}@example.com`,
    password: 'Password123!',
    location: 'Srinagar',
  });
  const token = regRes.body.data.accessToken;

  const commRes = await request(app)
    .post('/api/communities')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Srinagar Tech',
      description: 'Local tech community in Srinagar',
      location: 'Srinagar',
    });

  return { token, user: regRes.body.data.user, community: commRes.body.data };
};

describe('Posts & Comments API', () => {
  it('should create, update, like (preventing duplicates), comment on, and delete a post', async () => {
    const { token, community } = await setupUserAndCommunity('owner');

    // Create post
    const createRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        communityId: community._id,
        title: 'Local Coding Meetup',
        content: 'Join us this Saturday for a backend engineering meetup!',
        category: 'Technology',
      });

    expect(createRes.status).toBe(201);
    const postId = createRes.body.data._id;

    // Update post
    const updateRes = await request(app)
      .patch(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Coding Meetup' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Updated Coding Meetup');

    // Like post
    const likeRes = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(likeRes.status).toBe(200);
    expect(likeRes.body.data.likesCount).toBe(1);

    // Duplicate like prevention
    const dupLikeRes = await request(app)
      .post(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(dupLikeRes.status).toBe(409);

    // Add comment
    const commentRes = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Count me in!' });

    expect(commentRes.status).toBe(201);

    // Delete post
    const deleteRes = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
  });

  it('should reject unauthorized post modification with 403', async () => {
    const { token: ownerToken, community } = await setupUserAndCommunity('a');

    const postRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        communityId: community._id,
        title: 'Owner Post',
        content: 'Only owner should edit this',
        category: 'General',
      });

    const otherReg = await request(app).post('/api/auth/register').send({
      name: 'Other User',
      email: 'otheruser@example.com',
      password: 'Password123!',
      location: 'Srinagar',
    });

    const otherToken = otherReg.body.data.accessToken;

    const patchRes = await request(app)
      .patch(`/api/posts/${postRes.body.data._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Hacked Title' });

    expect(patchRes.status).toBe(403);
  });
});

