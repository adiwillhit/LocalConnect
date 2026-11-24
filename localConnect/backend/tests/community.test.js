import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

const registerUser = async (overrides = {}) => {
  const payload = {
    name: 'Test User',
    email: `user_${Date.now()}_${Math.random()}@example.com`,
    password: 'Password123!',
    location: 'Delhi',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return {
    token: res.body.data.accessToken,
    user: res.body.data.user,
  };
};

describe('Communities API', () => {
  it('should create a community successfully', async () => {
    const { token } = await registerUser();

    const res = await request(app)
      .post('/api/communities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Delhi Community',
        description: 'Connect with neighbors across Delhi NCR',
        location: 'Delhi',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Delhi Community');
    expect(res.body.data.membersCount).toBe(1);
  });

  it('should allow another user to join, prevent duplicate join, and allow leaving', async () => {
    const owner = await registerUser({ email: 'owner@example.com' });
    const member = await registerUser({ email: 'member@example.com' });

    const createRes = await request(app)
      .post('/api/communities')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({
        name: 'Bangalore Community',
        description: 'Tech, events, and local updates in Bangalore',
        location: 'Bangalore',
      });

    const communityId = createRes.body.data._id;

    // Join
    const joinRes = await request(app)
      .post(`/api/communities/${communityId}/join`)
      .set('Authorization', `Bearer ${member.token}`);

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.data.membersCount).toBe(2);

    // Duplicate join prevention
    const dupJoinRes = await request(app)
      .post(`/api/communities/${communityId}/join`)
      .set('Authorization', `Bearer ${member.token}`);

    expect(dupJoinRes.status).toBe(409);

    // Leave
    const leaveRes = await request(app)
      .post(`/api/communities/${communityId}/leave`)
      .set('Authorization', `Bearer ${member.token}`);

    expect(leaveRes.status).toBe(200);
    expect(leaveRes.body.data.membersCount).toBe(1);

    // Leaving again when not a member
    const leaveAgainRes = await request(app)
      .post(`/api/communities/${communityId}/leave`)
      .set('Authorization', `Bearer ${member.token}`);

    expect(leaveAgainRes.status).toBe(400);
  });

  it('should filter communities by location and search query', async () => {
    const { token } = await registerUser();

    await request(app)
      .post('/api/communities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Srinagar Community',
        description: 'Updates from Srinagar',
        location: 'Srinagar',
      });

    await request(app)
      .post('/api/communities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Jammu Community',
        description: 'Updates from Jammu',
        location: 'Jammu',
      });

    const res = await request(app).get('/api/communities?location=Srinagar');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Srinagar Community');
  });
});

