// src/api/interceptors.js
import apiClient from './axiosInstance';
import { store } from '../store';
import {
  selectAccessToken,
  selectRefreshToken,
  setTokens,
  clearCredentials,
} from '../store/slices/authSlice';
import { saveTokens, clearAuthStorage } from '../utils/storage';
import { queryClient } from './queryClient';

let isRefreshing = false;
/** Queue of { resolve, reject } waiting for a new token */
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// ── Request interceptor ──────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = selectAccessToken(state);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ─────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and only once per request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(Promise.reject.bind(Promise));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const state = store.getState();
      const refreshToken = selectRefreshToken(state);

      if (!refreshToken) {
        isRefreshing = false;
        await _handleLogout();
        return Promise.reject(error);
      }

      try {
        // POST /api/auth/refresh
        const { data } = await apiClient.post('/auth/refresh', { refreshToken });
        const { accessToken: newAccess, refreshToken: newRefresh } =
          data.data ?? data;

        // Persist to Redux + AsyncStorage
        store.dispatch(setTokens({ accessToken: newAccess, refreshToken: newRefresh }));
        await saveTokens(newAccess, newRefresh);

        // Update header and retry
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccess}`;

        processQueue(null, newAccess);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await _handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/** Clear everything and reset query cache on forced logout */
async function _handleLogout() {
  store.dispatch(clearCredentials());
  await clearAuthStorage();
  queryClient.clear();
}

export default apiClient;
