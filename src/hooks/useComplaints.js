// src/hooks/useComplaints.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { complaintService } from '../api/services/complaintService';
import { QUERY_KEYS } from '../constants';

/**
 * Fetch the resident's complaint history.
 * Endpoint: GET /api/complaints
 *
 * staleTime: 0 → always fresh on mount (e.g. status changed to "resolved").
 * 60 s poll keeps status badges updating passively.
 */
export function useComplaints(params) {
  return useQuery({
    queryKey: [...QUERY_KEYS.COMPLAINTS, params],
    queryFn: () => complaintService.getComplaints(params),
    staleTime: 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

/** Submit a new complaint — POST /api/complaints */
export function useCreateComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => complaintService.createComplaint(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMPLAINTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD('resident') });
      Toast.show({ type: 'success', text1: 'Complaint Submitted', text2: 'Your complaint has been recorded.' });
    },
  });
}