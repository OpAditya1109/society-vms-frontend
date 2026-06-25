// src/api/services/societyService.js

import api from '../interceptors';

export const societyService = {
  /** Public — fetches list for registration screen dropdown */
  getSocieties: (params) =>
    api.get('/societies', { params }).then((r) => r.data),

  getSocietyById: (id) =>
    api.get(`/societies/${id}`).then((r) => r.data),

  /**
   * Public — creates a new society + first admin in one shot.
   * POST /api/societies/bootstrap
   * Body: { society: { name, address, totalFlats }, admin: { firstName, lastName, email, mobile, password } }
   */
  bootstrapSociety: (payload) =>                          // ← ADD THIS
    api.post('/societies/bootstrap', payload).then((r) => r.data),

  /** Admin only */
  createSociety: (payload) =>
    api.post('/societies', payload).then((r) => r.data),

  updateSociety: (id, payload) =>
    api.patch(`/societies/${id}`, payload).then((r) => r.data),

  getSocietyMembers: (id) =>
    api.get(`/societies/${id}/members`).then((r) => r.data),

  getMyMembers: () =>
    api.get('/societies/my/members').then((r) => r.data),

  searchResidents: (flatNumber) =>
    api.get('/societies/my/residents', { params: { flatNumber } }).then((r) => r.data),
};