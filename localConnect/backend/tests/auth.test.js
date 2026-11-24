import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Authentication API', () => {
  const sampleUser = {
    name: 'Aarav Sharma',
    email: 'aarav@example.com',
    password: 'Password123!',
    location: 'Srinagar',
  };

  it('should register a new user successfully and not return password', async () => {
    const res = await request(app).post('/api/auth/register').send(sampleUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(sampleUser.email);
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it('should reject duplicate email registration with 409', async () => {
    await request(app).post('/api/auth/register').send(sampleUser);
    const res = await request(app).post('/api/auth/register').send(sampleUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should login successfully with valid credentials', async () => {
    await request(app).post('/api/auth/register').send(sampleUser);

    const res = await request(app).post('/api/auth/login').send({
      email: sampleUser.email,
      password: sampleUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('should reject login with invalid password', async () => {
    await request(app).post('/api/auth/register').send(sampleUser);

    const res = await request(app).post('/api/auth/login').send({
      email: sampleUser.email,
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should protect /api/auth/me without token and allow with valid token', async () => {
    const unauthRes = await request(app).get('/api/auth/me');
    expect(unauthRes.status).toBe(401);

    const regRes = await request(app).post('/api/auth/register').send(sampleUser);
    const token = regRes.body.data.accessToken;

    const authRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(authRes.status).toBe(200);
    expect(authRes.body.data.email).toBe(sampleUser.email);
  });

  it('should rotate refresh tokens and reject reuse of old refresh token', async () => {
    const regRes = await request(app).post('/api/auth/register').send(sampleUser);
    const oldRefreshToken = regRes.body.data.refreshToken;

    const refreshRes = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: oldRefreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).not.toBe(oldRefreshToken);

    // Reusing old refresh token must fail
    const reuseRes = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken: oldRefreshToken });

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.success).toBe(false);
  });

  it('should revoke refresh token on logout', async () => {
    const regRes = await request(app).post('/api/auth/register').send(sampleUser);
    const { refreshToken } = regRes.body.data;

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken });

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    const afterLogoutRefresh = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken });

    expect(afterLogoutRefresh.status).toBe(401);
  });
});

