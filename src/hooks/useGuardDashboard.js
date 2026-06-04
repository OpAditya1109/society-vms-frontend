// src/hooks/useGuardDashboard.js
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../api/services/dashboardService';
import { QUERY_KEYS } from '../constants';

/**
 * Fetches the guard dashboard data.
 * Endpoint: GET /api/dashboard/guard
 * Returns: {
 *   visitorsWaiting,   – pending approval count
 *   todayEntries,      – total entries today
 *   currentlyInside,   – approved + not checked out
 *   recentEntries,     – last 10 visitor entries
 *   hourlyBreakdown    – array of { _id: hour, count }
 * }
 */
export function useGuardDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD('guard'),
    queryFn: () => dashboardService.getGuardDashboard(),
    staleTime: 60 * 1000,
  });
}