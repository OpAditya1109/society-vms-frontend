// src/api/services/sosService.js
import api from '../interceptors';

export const sosService = {
  trigger:     (message)  => api.post('/sos', { message }).then(r => r.data),
  getAlerts:   ()         => api.get('/sos').then(r => r.data),
  myAlerts:    ()         => api.get('/sos/my-alerts').then(r => r.data),
  acknowledge: (id)       => api.patch(`/sos/${id}/acknowledge`).then(r => r.data),
  resolve:     (id)       => api.patch(`/sos/${id}/resolve`).then(r => r.data),
};