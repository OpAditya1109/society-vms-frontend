// src/api/services/dailyHelpService.js
import apiClient from '../axiosInstance';

const BASE = '/daily-help';

export const dailyHelpService = {
  getAll:          ()                    => apiClient.get(BASE),
  add:             (data)                => apiClient.post(BASE, data),
  update:          (id, data)            => apiClient.patch(`${BASE}/${id}`, data),
  remove:          (id)                  => apiClient.delete(`${BASE}/${id}`),
  markAttendance:  (id, data)            => apiClient.post(`${BASE}/${id}/attendance`, data),
  getAttendance:   (id, month, year)     => apiClient.get(`${BASE}/${id}/attendance`, { params: { month, year } }),
  getEntryHistory: (id)                  => apiClient.get(`${BASE}/${id}/entry-history`),
};