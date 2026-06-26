// src/hooks/useGuardDashboard.js
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../api/services/dashboardService';
import { QUERY_KEYS } from '../constants';

/**
 * Fetches the guard dashboard data.
 * Endpoint: GET /api/dashboard/guard
 *
 * Polls every 20 s so "visitors waiting" counter and recent entries
 * update automatically without the guard needing to pull-to-refresh.
 */
export function useGuardDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD('guard'),
    queryFn: () => dashboardService.getGuardDashboard(),
    staleTime: 0,
    refetchInterval: 20_000,
    refetchIntervalInBackground: false,
  });
}