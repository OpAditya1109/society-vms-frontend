// src/api/services/amenityService.js
import api from '../interceptors';

export const amenityService = {
  list:          ()                            => api.get('/amenities').then(r => r.data),
  create:        (payload)                     => api.post('/amenities', payload).then(r => r.data),
  getSlots:      (id, date)                    => api.get(`/amenities/${id}/slots`, { params: { date } }).then(r => r.data),
  book:          (id, payload)                 => api.post(`/amenities/${id}/book`, payload).then(r => r.data),
  myBookings:    ()                            => api.get('/amenities/my-bookings').then(r => r.data),
  cancelBooking: (bookingId)                   => api.patch(`/amenities/bookings/${bookingId}/cancel`).then(r => r.data),
};