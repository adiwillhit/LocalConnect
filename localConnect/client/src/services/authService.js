import { api } from './api';

export const authService = {
  async register(payload) {
    const res = await api.post('/auth/register', payload);
    return res.data.data;
  },

  async login(payload) {
    const res = await api.post('/auth/login', payload);
    return res.data.data;
  },

  async logout(refreshToken) {
    const res = await api.post('/auth/logout', { refreshToken });
    return res.data;
  },

  async getMe() {
    const res = await api.get('/users/me');
    return res.data.data;
  },
};

