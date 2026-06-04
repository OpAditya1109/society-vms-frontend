// src/api/services/familyMemberService.js
import apiClient from '../axiosInstance';

const BASE = '/family-members';

export const familyMemberService = {
  getAll: ()           => apiClient.get(BASE),
  add:    (data)       => apiClient.post(BASE, data),
  update: (id, data)   => apiClient.patch(`${BASE}/${id}`, data),
  remove: (id)         => apiClient.delete(`${BASE}/${id}`),
};