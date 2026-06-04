// src/hooks/useVisitors.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { visitorService } from '../api/services/visitorService';
import { QUERY_KEYS } from '../constants';

/**
 * Fetch paginated visitor list for the authenticated resident.
 * Endpoint: GET /api/visitors
 */
export function useVisitors(params) {
  return useQuery({
    queryKey: [...QUERY_KEYS.VISITORS, params],
    queryFn: () => visitorService.getVisitors(params),
  });
}

/**
 * Approve a visitor request.
 * Endpoint: PATCH /api/visitors/:id/approve
 */
export function useApproveVisitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => visitorService.approveVisitor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VISITORS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD('resident') });
      Toast.show({ type: 'success', text1: 'Visitor Approved', text2: 'The visitor has been approved.' });
    },
  });
}

/**
 * Reject a visitor request.
 * Endpoint: PATCH /api/visitors/:id/reject
 */
export function useRejectVisitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rejectionReason }) =>
      visitorService.rejectVisitor(id, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VISITORS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD('resident') });
      Toast.show({ type: 'success', text1: 'Visitor Rejected', text2: 'The visitor has been rejected.' });
    },
  });
}