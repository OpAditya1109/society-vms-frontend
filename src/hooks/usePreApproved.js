// src/hooks/usePreApproved.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { preApprovedService } from '../api/services/preApprovedService';

const KEY = ['pre-approved'];

export function usePreApproved() {
  return useQuery({ queryKey: KEY, queryFn: () => preApprovedService.getList() });
}

export function useAddPreApproved() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => preApprovedService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      Toast.show({ type: 'success', text1: 'Added to Whitelist' });
    },
    onError: (e) => Toast.show({ type: 'error', text1: e?.response?.data?.message ?? 'Failed to add' }),
  });
}

export function useUpdatePreApproved() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => preApprovedService.update(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); Toast.show({ type: 'success', text1: 'Updated' }); },
  });
}

export function useRemovePreApproved() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => preApprovedService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); Toast.show({ type: 'success', text1: 'Removed from Whitelist' }); },
  });
}