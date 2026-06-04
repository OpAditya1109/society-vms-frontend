// src/api/services/noticeService.js
/**
 * Notice endpoints — mirrors backend src/routes/notice.routes.js
 *
 * GET    /api/notices        (all roles)
 * GET    /api/notices/:id    (all roles)
 * POST   /api/notices        (admin only)
 * PATCH  /api/notices/:id    (admin only)
 * DELETE /api/notices/:id    (admin only – soft delete)
 */
import api from '../interceptors';

export const noticeService = {
  getNotices: (params) =>
    api.get('/notices', { params }).then((r) => r.data),

  getNoticeById: (id) =>
    api.get(`/notices/${id}`).then((r) => r.data),

  /** Admin only */
  createNotice: (payload) =>
    api.post('/notices', payload).then((r) => r.data),

  /** Admin only */
  updateNotice: (id, payload) =>
    api.patch(`/notices/${id}`, payload).then((r) => r.data),

  /** Admin only — soft delete */
  deleteNotice: (id) =>
    api.delete(`/notices/${id}`).then((r) => r.data),
};
