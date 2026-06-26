// src/api/queryClient.js
import { QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';
import Toast from 'react-native-toast-message';

// ── Refocus on foreground (React Native equivalent of refetchOnWindowFocus) ───
// React Query's built-in window focus uses the DOM — on RN we wire AppState.
function createAppStateFocusManager() {
  return {
    subscribe(onFocus) {
      const sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') onFocus();
      });
      return () => sub.remove();
    },
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),

      /**
       * staleTime = 0 means data is immediately considered stale, so:
       *  - Coming back from background → refetch fires (via AppState focus manager)
       *  - Navigating back to a screen → refetch fires (refetchOnMount: 'always')
       *
       * Individual hooks override staleTime when data truly doesn't change often
       * (e.g. amenity catalogue, community members).
       */
      staleTime: 0,
      gcTime: 10 * 60 * 1000,          // keep cache for 10 min for instant skeleton
      refetchOnMount: true,             // refetch whenever screen mounts / re-focuses
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,       // works via AppState manager below
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

// Wire AppState → React Query's focus manager so refetchOnWindowFocus
// fires whenever the app returns from background on Android/iOS.
queryClient.getDefaultOptions(); // ensure client is initialised
import('@tanstack/react-query').then(({ focusManager }) => {
  focusManager.setEventListener((onFocus) => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') onFocus();
    });
    return () => sub.remove();
  });
});