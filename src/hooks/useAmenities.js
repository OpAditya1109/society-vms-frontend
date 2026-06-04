// src/hooks/useAmenities.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { amenityService } from '../api/services/amenityService';

const AMENITY_KEY   = ['amenities'];
const BOOKINGS_KEY  = ['amenity-bookings'];
const slotsKey      = (id, date) => ['amenity-slots', id, date];

export function useAmenities() {
  return useQuery({ queryKey: AMENITY_KEY, queryFn: () => amenityService.list(), staleTime: 5 * 60 * 1000 });
}

export function useAmenitySlots(id, date) {
  return useQuery({
    queryKey: slotsKey(id, date),
    queryFn: () => amenityService.getSlots(id, date),
    enabled: !!id && !!date,
    staleTime: 60 * 1000,
  });
}

export function useMyBookings() {
  return useQuery({ queryKey: BOOKINGS_KEY, queryFn: () => amenityService.myBookings() });
}

export function useBookSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ amenityId, ...payload }) => amenityService.book(amenityId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
      qc.invalidateQueries({ queryKey: slotsKey(vars.amenityId, vars.date) });
      Toast.show({ type: 'success', text1: 'Slot Booked!', text2: 'Your reservation is confirmed.' });
    },
    onError: (e) => Toast.show({ type: 'error', text1: e?.response?.data?.message ?? 'Booking failed' }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId) => amenityService.cancelBooking(bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
      Toast.show({ type: 'success', text1: 'Booking Cancelled' });
    },
  });
}