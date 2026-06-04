// src/hooks/useComplaints.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { complaintService } from '../api/services/complaintService';
import { QUERY_KEYS } from '../constants';

/**
 * Fetch the resident's complaint history.
 * Endpoint: GET /api/complaints
 */
export function useComplaints(params) {
  return useQuery({
    queryKey: [...QUERY_KEYS.COMPLAINTS, params],
    queryFn: () => complaintService.getComplaints(params),
  });
}

/**
 * Submit a new complaint.
 * Endpoint: POST /api/complaints
 * Payload: { title, description, category?, priority? }
 */
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