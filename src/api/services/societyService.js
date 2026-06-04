// src/api/services/societyService.js
/**
 * Society endpoints — mirrors backend src/routes/society.routes.js
 *
 * GET   /api/societies           (public — used in registration dropdown)
 * GET   /api/societies/:id       (public)
 * POST  /api/societies           (admin only)
 * PATCH /api/societies/:id       (admin only)
 * GET   /api/societies/:id/members    (admin only)
 * GET   /api/societies/my/members     (admin — own society members)
 */
import api from '../interceptors';

export const societyService = {
  /** Public — fetches list for registration screen dropdown */
  getSocieties: (params) =>
    api.get('/societies', { params }).then((r) => r.data),

  getSocietyById: (id) =>
    api.get(`/societies/${id}`).then((r) => r.data),

  /** Admin only */
  createSociety: (payload) =>
    api.post('/societies', payload).then((r) => r.data),

  /** Admin only */
  updateSociety: (id, payload) =>
    api.patch(`/societies/${id}`, payload).then((r) => r.data),

  /** Admin only — members of a specific society */
  getSocietyMembers: (id) =>
    api.get(`/societies/${id}/members`).then((r) => r.data),

  /** Admin only — members of admin's own society */
  getMyMembers: () =>
    api.get('/societies/my/members').then((r) => r.data),

  /**
   * Guard / Admin — search residents in own society by flat number.
   * GET /api/societies/my/residents?flatNumber=A101
   */
  searchResidents: (flatNumber) =>
    api.get('/societies/my/residents', { params: { flatNumber } }).then((r) => r.data),
};