// src/hooks/useAdminDashboard.js
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../api/services/dashboardService';
import { QUERY_KEYS } from '../constants';

/**
 * Fetches the admin dashboard data.
 * Endpoint: GET /api/dashboard/admin
 *
 * Polls every 30 s so complaint/resident counts stay live.
 */
export function useAdminDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD('admin'),
    queryFn: () => dashboardService.getAdminDashboard(),
    staleTime: 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}