// src/api/services/authService.js
/**
 * Auth endpoints — mirrors backend src/routes/auth.routes.js
 *
 * POST   /api/auth/register
 * POST   /api/auth/login
 * POST   /api/auth/refresh
 * POST   /api/auth/logout        (protected)
 * GET    /api/auth/me            (protected)
 * PATCH  /api/auth/me            (protected)
 * PATCH  /api/auth/push-token    (protected) 🆕
 * DELETE /api/auth/push-token    (protected) 🆕
 */
import api from '../interceptors';

export const authService = {
  /**
   * Register a new user.
   */
  register: (payload) =>
    api.post('/auth/register', payload).then((r) => r.data),

  /**
   * Login with email + password.
   */
  login: (credentials) =>
    api.post('/auth/login', credentials).then((r) => r.data),

  /**
   * Refresh access token.
   */
  refresh: (refreshToken) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data),

  /** Logout (invalidates refresh token on server). */
  logout: () => api.post('/auth/logout').then((r) => r.data),

  /** Get current authenticated user profile. */
  getMe: () => api.get('/auth/me').then((r) => r.data),

  /** Update profile (name, mobile, password). */
  updateProfile: (payload) => api.patch('/auth/me', payload).then((r) => r.data),

  /**
   * 🆕 Save Expo push token to backend.
   * Call this once after login / on app launch if already logged in.
   * @param {string} expoPushToken  - ExponentPushToken[xxx] string
   */
  updatePushToken: (expoPushToken) =>
    api.patch('/auth/push-token', { expoPushToken }).then((r) => r.data),

  /**
   * 🆕 Remove push token from backend (call on logout or device change).
   */
  clearPushToken: () =>
    api.delete('/auth/push-token').then((r) => r.data),
};