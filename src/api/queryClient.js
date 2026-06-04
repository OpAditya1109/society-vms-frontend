// src/api/queryClient.js
import { QueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Retry logic:
       * - Never retry on 401 (unauthorized) or 403 (forbidden)
       * - Otherwise retry up to 2 times
       */
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime:    10 * 60 * 1000,     // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      onError: (error) => {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Something went wrong';
        Toast.show({ type: 'error', text1: 'Error', text2: message });
      },
    },
  },
});
