import { api } from './api';

export const communityService = {
  async getAll(params = {}) {
    const res = await api.get('/communities', { params });
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/communities/${id}`);
    return res.data.data;
  },

  async create(payload) {
    const res = await api.post('/communities', payload);
    return res.data.data;
  },

  async join(id) {
    const res = await api.post(`/communities/${id}/join`);
    return res.data.data;
  },

  async leave(id) {
    const res = await api.delete(`/communities/${id}/join`);
    return res.data.data;
  },

  async getMembers(id, params = {}) {
    const res = await api.get(`/communities/${id}/members`, { params });
    return res.data;
  },

  async getPosts(id, params = {}) {
    const res = await api.get(`/communities/${id}/posts`, { params });
    return res.data;
  },
};

