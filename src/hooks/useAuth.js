// src/hooks/useAuth.js
import { useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';

import { authService }    from '../api/services/authService';
import {
  setCredentials,
  clearCredentials,
  setUser,
  selectCurrentUser,
  selectIsAuthenticated,
  selectUserRole,
} from '../store/slices/authSlice';
import { saveTokens, clearAuthStorage } from '../utils/storage';
import { queryClient } from '../api/queryClient';

export function useAuth() {
  const dispatch = useDispatch();
  const user            = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role            = useSelector(selectUserRole);

  // ── Login ──────────────────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: (credentials) => authService.login(credentials),
    onSuccess: async (response) => {
      const { user: u, accessToken, refreshToken } = response.data;
      await saveTokens(accessToken, refreshToken);
      dispatch(setCredentials({ user: u, accessToken, refreshToken }));
    },
    onError: (error) => {
      const msg = error?.response?.data?.message ?? error?.message ?? 'Login failed';
      Toast.show({ type: 'error', text1: 'Login Failed', text2: msg });
    },
  });

  // ── Register ───────────────────────────────────────────────────────────
  const registerMutation = useMutation({
    mutationFn: (payload) => authService.register(payload),
    onSuccess: async (response) => {
      const { user: u, accessToken, refreshToken } = response.data;
      await saveTokens(accessToken, refreshToken);
      dispatch(setCredentials({ user: u, accessToken, refreshToken }));
    },
    onError: (error) => {
      const msg = error?.response?.data?.message ?? error?.message ?? 'Registration failed';
      Toast.show({ type: 'error', text1: 'Registration Failed', text2: msg });
    },
  });

  // ── Update Profile ─────────────────────────────────────────────────────
  const updateProfileMutation = useMutation({
    mutationFn: (payload) => authService.updateProfile(payload),
    onSuccess: (response) => {
      dispatch(setUser(response.data));
      Toast.show({ type: 'success', text1: 'Profile Updated', text2: 'Your changes have been saved.' });
    },
    onError: (error) => {
      const msg = error?.response?.data?.message ?? error?.message ?? 'Update failed';
      Toast.show({ type: 'error', text1: 'Update Failed', text2: msg });
    },
  });

  // ── Logout ─────────────────────────────────────────────────────────────
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: async () => {
      // Always clear local state regardless of server response
      dispatch(clearCredentials());
      await clearAuthStorage();
      queryClient.clear();
    },
  });

  return {
    user,
    isAuthenticated,
    role,

    login:         loginMutation.mutate,
    register:      registerMutation.mutate,
    logout:        logoutMutation.mutate,
    updateProfile: updateProfileMutation.mutate,

    isLoginLoading:         loginMutation.isPending,
    isRegisterLoading:      registerMutation.isPending,
    isLogoutLoading:        logoutMutation.isPending,
    isUpdateProfileLoading: updateProfileMutation.isPending,
  };
}