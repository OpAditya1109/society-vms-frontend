// src/api/services/residentService.js
import api from '../interceptors';

export const residentService = {
  /** GET /api/residents?status=pending|active|inactive&search=&page=&limit= */
  getResidents: (params) =>
    api.get('/residents', { params }).then((r) => r.data),

  /** GET /api/residents/:id */
  getResident: (id) =>
    api.get(`/residents/${id}`).then((r) => r.data),

  /** PATCH /api/residents/:id/approve */
  approveResident: (id) =>
    api.patch(`/residents/${id}/approve`).then((r) => r.data),

  /** DELETE /api/residents/:id/reject  body: { softDelete?: boolean } */
  rejectResident: (id, softDelete = false) =>
    api.delete(`/residents/${id}/reject`, { data: { softDelete } }).then((r) => r.data),

  /** PATCH /api/residents/:id/deactivate */
  deactivateResident: (id) =>
    api.patch(`/residents/${id}/deactivate`).then((r) => r.data),

  /** PATCH /api/residents/:id/reactivate */
  reactivateResident: (id) =>
    api.patch(`/residents/${id}/reactivate`).then((r) => r.data),
};