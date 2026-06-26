// src/hooks/useVisitorLogs.js
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { visitorService } from '../api/services/visitorService';
import { QUERY_KEYS } from '../constants';

/**
 * Paginated visitor logs for guard.
 * Endpoint: GET /api/visitors?page=N&limit=15
 *
 * Auto-refresh strategy:
 *  - refetchInterval: 20s  → new visitors / status changes appear without pull-to-refresh
 *  - staleTime: 0          → navigating back to the screen always triggers a refetch
 */
export function useVisitorLogs(params = {}) {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.VISITORS, 'logs', params],
    queryFn: ({ pageParam = 1 }) =>
      visitorService.getVisitors({ page: pageParam, limit: 15, ...params }),
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta;
      if (!meta) return undefined;
      const { page, limit, total } = meta;
      return page * limit < total ? page + 1 : undefined;
    },
    staleTime: 0,
    refetchInterval: 20_000,          // poll every 20 s — catches approvals, checkouts
    refetchIntervalInBackground: false, // pause polling when app is backgrounded
  });
}

/**
 * Create a new visitor entry (guard only).
 * Endpoint: POST /api/visitors
 */
export function useCreateVisitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => visitorService.createVisitor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VISITORS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD('guard') });
      Toast.show({
        type: 'success',
        text1: 'Visitor Logged',
        text2: 'Visitor entry created. Awaiting resident approval.',
      });
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.message ?? error?.message ?? 'Failed to create visitor entry.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
}

/**
 * Check out a visitor (guard only).
 * Endpoint: PATCH /api/visitors/:id/checkout
 */
export function useCheckOutVisitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => visitorService.checkOutVisitor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VISITORS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD('guard') });
      Toast.show({ type: 'success', text1: 'Checked Out', text2: 'Visitor has been checked out.' });
    },
    onError: (error) => {
      const msg = error?.response?.data?.message ?? 'Failed to check out visitor.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
}