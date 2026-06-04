// src/api/services/dashboardService.js
/**
 * Dashboard endpoints — mirrors backend src/routes/dashboard.routes.js
 *
 * GET /api/dashboard            (auto-detects role, returns appropriate data)
 * GET /api/dashboard/resident   (resident only)
 * GET /api/dashboard/guard      (guard only)
 * GET /api/dashboard/admin      (admin only)
 */
import api from '../interceptors';

export const dashboardService = {
  /** Role-agnostic — server auto-selects data based on JWT role */
  getDashboard: () =>
    api.get('/dashboard').then((r) => r.data),

  getResidentDashboard: () =>
    api.get('/dashboard/resident').then((r) => r.data),

  getGuardDashboard: () =>
    api.get('/dashboard/guard').then((r) => r.data),

  getAdminDashboard: () =>
    api.get('/dashboard/admin').then((r) => r.data),
};
