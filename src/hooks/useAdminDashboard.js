// src/hooks/useAdminDashboard.js
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../api/services/dashboardService';
import { QUERY_KEYS } from '../constants';

/**
 * Fetches the admin dashboard data.
 * Endpoint: GET /api/dashboard/admin
 * Returns: { totalResidents, visitorsToday, openComplaints,
 *            recentVisitors, recentComplaints, ... }
 */
export function useAdminDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD('admin'),
    queryFn: () => dashboardService.getAdminDashboard(),
    staleTime: 2 * 60 * 1000,
  });
}