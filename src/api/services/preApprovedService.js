// src/api/services/preApprovedService.js
import api from '../interceptors';

export const preApprovedService = {
  getList: ()                        => api.get('/pre-approved').then(r => r.data),
  create:  (payload)                 => api.post('/pre-approved', payload).then(r => r.data),
  update:  (id, payload)             => api.patch(`/pre-approved/${id}`, payload).then(r => r.data),
  remove:  (id)                      => api.delete(`/pre-approved/${id}`).then(r => r.data),
  check:   (mobile, flatNumber)      => api.get(`/pre-approved/check/${mobile}`, { params: { flatNumber } }).then(r => r.data),
};