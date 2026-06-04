// src/hooks/useListings.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { listingService } from '../api/services/listingService';

// ── Query key factory ─────────────────────────────────────────────────────────
export const LISTING_KEYS = {
  all:    ['listings'],
  list:   (params) => ['listings', 'list', params],
  my:     ['listings', 'my'],
  detail: (id) => ['listings', id],
};

// ── Fetch all society listings ────────────────────────────────────────────────
export function useListings(params) {
  return useQuery({
    queryKey: LISTING_KEYS.list(params),
    queryFn:  () => listingService.getListings(params),
  });
}

// ── Fetch my listings ─────────────────────────────────────────────────────────
export function useMyListings() {
  return useQuery({
    queryKey: LISTING_KEYS.my,
    queryFn:  () => listingService.getMyListings(),
  });
}

// ── Fetch single listing ──────────────────────────────────────────────────────
export function useListing(id) {
  return useQuery({
    queryKey: LISTING_KEYS.detail(id),
    queryFn:  () => listingService.getListingById(id),
    enabled:  !!id,
  });
}

// ── Create listing ────────────────────────────────────────────────────────────
export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => listingService.createListing(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTING_KEYS.all });
      Toast.show({ type: 'success', text1: 'Listing Posted!', text2: 'Your listing is now visible to society members.' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Failed to post listing', text2: err?.response?.data?.message ?? 'Please try again.' });
    },
  });
}

// ── Update listing ────────────────────────────────────────────────────────────
export function useUpdateListing(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => listingService.updateListing(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTING_KEYS.all });
      queryClient.invalidateQueries({ queryKey: LISTING_KEYS.detail(id) });
      Toast.show({ type: 'success', text1: 'Listing Updated.' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Update failed', text2: err?.response?.data?.message ?? 'Please try again.' });
    },
  });
}

// ── Delete listing ────────────────────────────────────────────────────────────
export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => listingService.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTING_KEYS.all });
      Toast.show({ type: 'success', text1: 'Listing removed.' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Delete failed', text2: err?.response?.data?.message ?? 'Please try again.' });
    },
  });
}

// ── Toggle interest ───────────────────────────────────────────────────────────
export function useToggleInterest(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => listingService.toggleInterest(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: LISTING_KEYS.detail(id) });
      Toast.show({
        type: 'success',
        text1: res.data.interested ? '✅ Interest Registered' : 'Interest Removed',
        text2: res.data.interested ? 'The owner will be able to see your interest.' : '',
      });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Failed', text2: err?.response?.data?.message ?? 'Please try again.' });
    },
  });
}