// src/store/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

/**
 * @typedef {Object} UserProfile
 * @property {string}  _id
 * @property {string}  firstName
 * @property {string}  lastName
 * @property {string}  fullName
 * @property {string}  email
 * @property {string}  mobile
 * @property {'resident'|'guard'|'admin'} role
 * @property {string}  societyId
 * @property {string}  [flatNumber]
 * @property {boolean} isActive
 * @property {string}  [lastLogin]
 * @property {string}  createdAt
 */

/**
 * @typedef {Object} AuthState
 * @property {UserProfile|null} user
 * @property {string|null}      accessToken
 * @property {string|null}      refreshToken
 * @property {boolean}          isAuthenticated
 * @property {boolean}          isLoading
 * @property {string|null}      error
 */

/** @type {AuthState} */
const initialState = {
  user:            null,
  accessToken:     null,
  refreshToken:    null,
  isAuthenticated: false,
  isLoading:       false,
  error:           null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Called after successful login OR register
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user            = user;
      state.accessToken     = accessToken;
      state.refreshToken    = refreshToken;
      state.isAuthenticated = true;
      state.error           = null;
      state.isLoading       = false;
    },

    // Called after token refresh — only updates tokens, not user
    setTokens: (state, action) => {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken  = accessToken;
      state.refreshToken = refreshToken;
    },

    // Update user profile (e.g. after GET /api/auth/me)
    setUser: (state, action) => {
      state.user = action.payload;
    },

    // Loading state helpers
    authStart: (state) => {
      state.isLoading = true;
      state.error     = null;
    },
    authFailed: (state, action) => {
      state.isLoading = false;
      state.error     = action.payload;
    },

    // Called on logout or 401 that cannot be refreshed
    clearCredentials: (state) => {
      state.user            = null;
      state.accessToken     = null;
      state.refreshToken    = null;
      state.isAuthenticated = false;
      state.isLoading       = false;
      state.error           = null;
    },
  },
});

export const {
  setCredentials,
  setTokens,
  setUser,
  authStart,
  authFailed,
  clearCredentials,
} = authSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────
export const selectCurrentUser         = (state) => state.auth.user;
export const selectUserStatus      = (state) => state.auth.user?.status ?? null;  // ← ADD THIS
export const selectAccessToken         = (state) => state.auth.accessToken;
export const selectRefreshToken        = (state) => state.auth.refreshToken;
export const selectIsAuthenticated     = (state) => state.auth.isAuthenticated;
export const selectIsAuthLoading       = (state) => state.auth.isLoading;
export const selectAuthError           = (state) => state.auth.error;
export const selectUserRole            = (state) => state.auth.user?.role ?? null;
export const selectUserSocietyId       = (state) => state.auth.user?.societyId ?? null;

export default authSlice.reducer;
