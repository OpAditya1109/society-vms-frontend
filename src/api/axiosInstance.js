// src/api/axiosInstance.js
import axios from 'axios';
import Constants from 'expo-constants';

/**
 * FIX: Read from EXPO_PUBLIC_API_BASE_URL env var first (works with .env),
 * then fall back to app.json → extra.apiBaseUrl, then hardcoded localhost.
 *
 * For Android emulator use: EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5001/api
 * For physical device use your machine's local IP: http://192.168.x.x:5001/api
 */
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  Constants.expoConfig?.extra?.apiBaseUrl ??
  'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export default apiClient;