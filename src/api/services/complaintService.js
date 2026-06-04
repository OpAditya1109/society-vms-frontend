// src/api/services/complaintService.js
/**
 * Complaint endpoints — mirrors backend src/routes/complaint.routes.js
 *
 * GET   /api/complaints              (resident: own | admin: all in society)
 * GET   /api/complaints/:id
 * POST  /api/complaints              (resident only)
 * PATCH /api/complaints/:id/status   (admin only)
 */
import api from '../interceptors';

export const complaintService = {
  getComplaints: (params) =>
    api.get('/complaints', { params }).then((r) => r.data),

  getComplaintById: (id) =>
    api.get(`/complaints/${id}`).then((r) => r.data),

  /** Resident only */
  createComplaint: (payload) =>
    api.post('/complaints', payload).then((r) => r.data),

  /** Admin only */
  updateComplaintStatus: (id, payload) =>
    api.patch(`/complaints/${id}/status`, payload).then((r) => r.data),
};
