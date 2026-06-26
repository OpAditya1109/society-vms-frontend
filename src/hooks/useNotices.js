// src/hooks/useNotices.js
import { useQuery } from '@tanstack/react-query';
import { noticeService } from '../api/services/noticeService';
import { QUERY_KEYS } from '../constants';

/**
 * Fetch paginated notices for the resident's society.
 * Endpoint: GET /api/notices
 *
 * staleTime: 0 + global refetchOnMount means every visit to the
 * Notices screen shows fresh data. 60 s poll catches new admin posts.
 */
export function useNotices(params) {
  return useQuery({
    queryKey: [...QUERY_KEYS.NOTICES, params],
    queryFn: () => noticeService.getNotices(params),
    staleTime: 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

/** Fetch a single notice by ID — Endpoint: GET /api/notices/:id */
export function useNoticeById(id) {
  return useQuery({
    queryKey: QUERY_KEYS.NOTICE(id),
    queryFn: () => noticeService.getNoticeById(id),
    enabled: !!id,
    staleTime: 60_000,               // detail pages change rarely
  });
}