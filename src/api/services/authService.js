// src/api/services/authService.js
/**
 * Auth endpoints — mirrors backend src/routes/auth.routes.js
 *
 * POST   /api/auth/register
 * POST   /api/auth/login
 * POST   /api/auth/refresh
 * POST   /api/auth/logout    (protected)
 * GET    /api/auth/me        (protected)
 */
import api from '../interceptors';

export const authService = {
  /**
   * Register a new user.
   * @param {{ firstName, lastName, email, mobile, password, role, societyId, flatNumber, registrationCode }} payload
   */
  register: (payload) =>
    api.post('/auth/register', payload).then((r) => r.data),

  /**
   * Login with email + password.
   * @param {{ email: string, password: string }} credentials
   */
  login: (credentials) =>
    api.post('/auth/login', credentials).then((r) => r.data),

  /**
   * Refresh access token.
   * @param {string} refreshToken
   */
  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data),

  /** Logout (invalidates refresh token on server). */
  logout: () => api.post('/auth/logout').then((r) => r.data),

  /** Get current authenticated user profile. */
  getMe: () => api.get('/auth/me').then((r) => r.data),

  /** Update profile (name, mobile, password). */
  updateProfile: (payload) => api.patch('/auth/me', payload).then((r) => r.data),
};