// src/api/services/communityService.js
/**
 * Community Post endpoints
 *
 * GET    /api/community            – all posts in society (paginated, filterable by category)
 * POST   /api/community            – create a post
 * GET    /api/community/my         – posts by current user
 * GET    /api/community/:id        – single post with comments
 * PATCH  /api/community/:id        – update own post
 * DELETE /api/community/:id        – delete own post
 * POST   /api/community/:id/like   – toggle like
 * POST   /api/community/:id/comments     – add comment
 * DELETE /api/community/:id/comments/:cid – delete comment
 * PATCH  /api/community/:id/pin    – admin: toggle pin
 */
import api from '../interceptors';

export const communityService = {
  getPosts: (params) =>
    api.get('/community', { params }).then((r) => r.data),

  getMyPosts: () =>
    api.get('/community/my').then((r) => r.data),

  getPostById: (id) =>
    api.get(`/community/${id}`).then((r) => r.data),

  createPost: (payload) =>
    api.post('/community', payload).then((r) => r.data),

  updatePost: (id, payload) =>
    api.patch(`/community/${id}`, payload).then((r) => r.data),

  deletePost: (id) =>
    api.delete(`/community/${id}`).then((r) => r.data),

  toggleLike: (id) =>
    api.post(`/community/${id}/like`).then((r) => r.data),

  addComment: (id, text) =>
    api.post(`/community/${id}/comments`, { text }).then((r) => r.data),

  deleteComment: (id, commentId) =>
    api.delete(`/community/${id}/comments/${commentId}`).then((r) => r.data),

  togglePin: (id) =>
    api.patch(`/community/${id}/pin`).then((r) => r.data),

  /**
   * Upload a community post image to Cloudinary via backend.
   * @param {string} imageUri  Local URI from expo-image-picker
   * @returns {Promise<{ photoUrl: string, publicId: string }>}
   */
  uploadCommunityPhoto: async (imageUri) => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('photo', {
      uri: imageUri,
      name: filename ?? 'community_photo.jpg',
      type,
    });

    const response = await api.post('/upload/community-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // { success, data: { photoUrl, publicId } }
  },
};