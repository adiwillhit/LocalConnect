import { api } from './api';

export const userService = {
  async getProfile(id) {
    const res = await api.get(`/users/${id}`);
    return res.data.data;
  },

  async updateMe(payload) {
    const res = await api.put('/users/me', payload);
    return res.data.data;
  },

  async follow(id) {
    const res = await api.post(`/users/${id}/follow`);
    return res.data.data;
  },

  async unfollow(id) {
    const res = await api.delete(`/users/${id}/follow`);
    return res.data.data;
  },

  async getFollowers(id, params = {}) {
    const res = await api.get(`/users/${id}/followers`, { params });
    return res.data;
  },

  async getFollowing(id, params = {}) {
    const res = await api.get(`/users/${id}/following`, { params });
    return res.data;
  },

  async getStats(id) {
    const res = await api.get(`/users/${id}/stats`);
    return res.data.data;
  },
};

