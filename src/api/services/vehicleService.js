// src/api/services/vehicleService.js
import apiClient from '../axiosInstance';

const BASE = '/vehicles';

export const vehicleService = {
  getAll: ()           => apiClient.get(BASE),
  add:    (data)       => apiClient.post(BASE, data),
  update: (id, data)   => apiClient.patch(`${BASE}/${id}`, data),
  remove: (id)         => apiClient.delete(`${BASE}/${id}`),
};