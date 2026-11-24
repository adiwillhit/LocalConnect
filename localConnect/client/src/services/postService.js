import { api } from './api';

export const postService = {
  async getFeed(params = {}) {
    const res = await api.get('/feed', { params });
    return res.data;
  },

  async getAll(params = {}) {
    const res = await api.get('/posts', { params });
    return res.data;
  },

  async getPopular(limit = 5) {
    const res = await api.get('/posts/popular', { params: { limit } });
    return res.data.data;
  },

  async create(payload) {
    const res = await api.post('/posts', payload);
    return res.data.data;
  },

  async update(id, payload) {
    const res = await api.put(`/posts/${id}`, payload);
    return res.data.data;
  },

  async remove(id) {
    const res = await api.delete(`/posts/${id}`);
    return res.data;
  },

  async like(id) {
    const res = await api.post(`/posts/${id}/like`);
    return res.data.data;
  },

  async unlike(id) {
    const res = await api.delete(`/posts/${id}/like`);
    return res.data.data;
  },

  async getComments(postId, params = {}) {
    const res = await api.get(`/posts/${postId}/comments`, { params });
    return res.data;
  },

  async addComment(postId, content) {
    const res = await api.post(`/posts/${postId}/comments`, { content });
    return res.data.data;
  },

  async deleteComment(commentId) {
    const res = await api.delete(`/comments/${commentId}`);
    return res.data;
  },
};

