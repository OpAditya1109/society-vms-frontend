// src/api/services/visitorService.js
/**
 * Visitor endpoints — mirrors backend src/routes/visitor.routes.js
 *
 * GET   /api/visitors            (resident: own | guard | admin: all in society)
 * GET   /api/visitors/:id
 * POST  /api/visitors            (guard only)
 * PATCH /api/visitors/:id/approve (resident only)
 * PATCH /api/visitors/:id/reject  (resident only)
 * PATCH /api/visitors/:id/checkout (guard only)
 */
import api from '../interceptors';

export const visitorService = {
  getVisitors: (params) =>
    api.get('/visitors', { params }).then((r) => r.data),

  getVisitorById: (id) =>
    api.get(`/visitors/${id}`).then((r) => r.data),

  /** Guard only */
  createVisitor: (payload) =>
    api.post('/visitors', payload).then((r) => r.data),

  /** Resident only */
  approveVisitor: (id) =>
    api.patch(`/visitors/${id}/approve`).then((r) => r.data),

  /** Resident only */
  rejectVisitor: (id, rejectionReason) =>
    api.patch(`/visitors/${id}/reject`, { rejectionReason }).then((r) => r.data),

  /** Guard only */
  checkOutVisitor: (id) =>
    api.patch(`/visitors/${id}/checkout`).then((r) => r.data),
  /**
   * Guard only — upload visitor photo to Cloudinary via backend.
   * @param {string} imageUri  Local URI from expo-image-picker
   * @returns {Promise<{ photoUrl: string, publicId: string }>}
   */
  uploadVisitorPhoto: async (imageUri) => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('photo', {
      uri: imageUri,
      name: filename ?? 'visitor_photo.jpg',
      type,
    });

    const response = await api.post('/upload/visitor-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // { success, data: { photoUrl, publicId } }
  },
};  