// src/hooks/useDashboard.js
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../api/services/dashboardService';
import { QUERY_KEYS } from '../constants';

/**
 * Fetches the resident dashboard data.
 * Endpoint: GET /api/dashboard/resident
 * Returns: { stats: { visitorsToday, pendingRequests, noticesCount, complaintsCount },
 *            recentVisitors, recentNotices }
 */
export function useResidentDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD('resident'),
    queryFn: () => dashboardService.getResidentDashboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes — dashboard refreshes more often
  });
}