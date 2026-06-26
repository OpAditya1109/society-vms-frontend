// src/hooks/useDashboard.js
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../api/services/dashboardService';
import { QUERY_KEYS } from '../constants';

/**
 * Fetches the resident dashboard data.
 * Endpoint: GET /api/dashboard/resident
 *
 * Polls every 30 s so pending-request counts and recent visitors
 * stay current automatically.
 */
export function useResidentDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD('resident'),
    queryFn: () => dashboardService.getResidentDashboard(),
    staleTime: 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}