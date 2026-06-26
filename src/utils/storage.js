// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN:    '@society_vms:access_token',
  REFRESH_TOKEN:   '@society_vms:refresh_token',
  USER:            '@society_vms:user',
  ONBOARDED:       '@society_vms:onboarded',
  PENDING_VISITOR: '@society_vms:pending_visitor', // ← NEW: survives app kill
};

// ── Token helpers ─────────────────────────────────────────────────────────

export const saveTokens = async (accessToken, refreshToken) => {
  await AsyncStorage.multiSet([
    [KEYS.ACCESS_TOKEN,  accessToken],
    [KEYS.REFRESH_TOKEN, refreshToken],
  ]);
};

export const getAccessToken = async () => {
  return AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
};

export const getRefreshToken = async () => {
  return AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
};

export const removeTokens = async () => {
  await AsyncStorage.multiRemove([KEYS.ACCESS_TOKEN, KEYS.REFRESH_TOKEN]);
};

// ── User helpers ──────────────────────────────────────────────────────────

export const saveUser = async (user) => {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const getUser = async () => {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  return raw ? JSON.parse(raw) : null;
};

export const removeUser = async () => {
  await AsyncStorage.removeItem(KEYS.USER);
};

// ── Full auth clear (called on logout) ───────────────────────────────────

export const clearAuthStorage = async () => {
  await AsyncStorage.multiRemove([
    KEYS.ACCESS_TOKEN,
    KEYS.REFRESH_TOKEN,
    KEYS.USER,
    KEYS.PENDING_VISITOR, // ← also clear pending visitor on logout
  ]);
};

// ── Onboarding flag ───────────────────────────────────────────────────────

export const setOnboarded = async () => {
  await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
};

export const hasOnboarded = async () => {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return val === 'true';
};

// ── Pending visitor helpers (persists across app kill) ────────────────────

export const savePendingVisitor = async (visitor) => {
  await AsyncStorage.setItem(KEYS.PENDING_VISITOR, JSON.stringify(visitor));
};

export const getSavedPendingVisitor = async () => {
  const raw = await AsyncStorage.getItem(KEYS.PENDING_VISITOR);
  return raw ? JSON.parse(raw) : null;
};

export const clearPendingVisitor = async () => {
  await AsyncStorage.removeItem(KEYS.PENDING_VISITOR);
};

// ── Generic helpers ───────────────────────────────────────────────────────

export const setItem = async (key, value) => {
  const toStore = typeof value === 'object' ? JSON.stringify(value) : String(value);
  await AsyncStorage.setItem(key, toStore);
};

export const getItem = async (key, parse = false) => {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  return parse ? JSON.parse(raw) : raw;
};

export const removeItem = async (key) => {
  await AsyncStorage.removeItem(key);
};

export { KEYS };