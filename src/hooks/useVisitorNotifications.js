// src/hooks/useVisitorNotifications.js
/**
 * useVisitorNotifications
 *
 * Connects to the backend via Socket.io and:
 *  1. Registers push-notification token with Expo
 *  2. Listens for `new_visitor` events and surfaces an in-app alert popup
 *  3. Dispatches an Expo local notification so the alert works when the app
 *     is backgrounded (foreground: popup card, background/killed: system notif)
 *  4. **Persists the pending visitor to AsyncStorage so the popup is restored
 *     when the app is reopened after being killed.**
 *  5. On mount (and each time the app returns to foreground), fetches any
 *     still-pending visitors from the API to catch missed socket events.
 *
 * USAGE — mount once in RootNavigator (inside NavigationContainer):
 *   const { pendingVisitor, dismissVisitor } = useVisitorNotifications();
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform, AppState } from 'react-native';
import { io }                 from 'socket.io-client';
import * as Notifications     from 'expo-notifications';
import * as Device            from 'expo-device';
import { useSelector }        from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from '../store/slices/authSlice';
import { ROLES, VISITOR_STATUS }  from '../constants';
import { visitorService }         from '../api/services/visitorService';
import {
  savePendingVisitor,
  getSavedPendingVisitor,
  clearPendingVisitor,
} from '../utils/storage';

// ── Notification handler (shows banner even when app is foregrounded) ─────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

const SOCKET_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api', '') ??
  'http://localhost:5001';

export function useVisitorNotifications() {
  const user            = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // The visitor that should be shown in the popup right now
  const [pendingVisitor, setPendingVisitor] = useState(null);

  const socketRef  = useRef(null);
  const appState   = useRef(AppState.currentState);
  const isMounted  = useRef(true);

  // ── Helper: set pending visitor in state AND persist to AsyncStorage ───────
  const showVisitor = useCallback((visitor) => {
    if (!isMounted.current) return;
    setPendingVisitor(visitor);
    savePendingVisitor(visitor).catch(() => {});
  }, []);

  // ── Helper: dismiss visitor from state AND clear from AsyncStorage ─────────
  const dismissVisitor = useCallback(() => {
    setPendingVisitor(null);
    clearPendingVisitor().catch(() => {});
  }, []);

  // ── On mount: restore any visitor that was pending when app was killed ──────
  useEffect(() => {
    if (!isAuthenticated || user?.role !== ROLES.RESIDENT) return;

    (async () => {
      try {
        // 1. Check AsyncStorage for a visitor that was pending before the kill
        const saved = await getSavedPendingVisitor();

        if (saved) {
          // Verify it's still actually pending on the server before showing
          try {
            const result = await visitorService.getVisitorById(saved._id);
            const fresh  = result?.data ?? result;
            if (fresh?.status === VISITOR_STATUS.PENDING) {
              if (isMounted.current) showVisitor(fresh);
              return; // found one — no need to list-fetch
            } else {
              // Already resolved while app was closed — clear storage
              await clearPendingVisitor();
            }
          } catch {
            // Network error — still show the cached version optimistically
            if (isMounted.current) showVisitor(saved);
            return;
          }
        }

        // 2. No saved visitor — fetch the list and pick the first pending one
        //    (handles cases where the push notification was not tapped / dismissed)
        await _fetchAndShowPendingVisitor(showVisitor);
      } catch (err) {
        console.warn('[VisitorNotifications] restore error:', err?.message);
      }
    })();

    return () => { isMounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?._id, user?.role]);

  // ── Request notification permission + register push token ─────────────────
  useEffect(() => {
    if (!isAuthenticated || user?.role !== ROLES.RESIDENT) return;
    _registerPushNotifications();
  }, [isAuthenticated, user?.role]);

  // ── Socket connection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?._id || user?.role !== ROLES.RESIDENT) return;

    const socket = io(SOCKET_URL, {
      transports:        ['websocket'],
      reconnection:      true,
      reconnectionDelay: 1_500,
    });

    socket.on('connect', () => {
      console.log('[Socket] connected', socket.id);
      socket.emit('register', {
        userId:    user._id,
        societyId: user.societyId,
      });
    });

    socket.on('new_visitor', ({ visitor }) => {
      console.log('[Socket] new_visitor', visitor);
      showVisitor(visitor);
      _sendLocalNotification(visitor);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] disconnected', reason);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?._id, user?.societyId, user?.role, showVisitor]);

  // ── App state handler: reconnect on foreground + re-check pending ──────────
  useEffect(() => {
    if (!isAuthenticated || user?.role !== ROLES.RESIDENT) return;

    const sub = AppState.addEventListener('change', async (next) => {
      const wasBackground = appState.current.match(/inactive|background/);
      appState.current = next;

      if (wasBackground && next === 'active') {
        // Reconnect socket if it dropped
        if (socketRef.current && !socketRef.current.connected) {
          socketRef.current.connect();
        }

        // Re-check for any pending visitor that arrived while backgrounded
        // Only fetch if we're not already showing one
        setPendingVisitor((current) => {
          if (!current) {
            // Fire async fetch without blocking
            _fetchAndShowPendingVisitor(showVisitor).catch(() => {});
          }
          return current;
        });
      }
    });

    return () => sub.remove();
  }, [isAuthenticated, user?._id, user?.role, showVisitor]);

  return { pendingVisitor, dismissVisitor };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fetch visitors list from API and show the first still-pending one.
 */
async function _fetchAndShowPendingVisitor(showVisitor) {
  try {
    const result   = await visitorService.getVisitors({ status: VISITOR_STATUS.PENDING });
    // API may return { data: [...] } or a plain array
    const visitors = result?.data ?? result ?? [];
    if (Array.isArray(visitors) && visitors.length > 0) {
      showVisitor(visitors[0]);
    }
  } catch (err) {
    console.warn('[VisitorNotifications] fetch pending error:', err?.message);
  }
}

async function _registerPushNotifications() {
  if (!Device.isDevice) return; // simulators can't receive push

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('visitor-alerts', {
      name:             'Visitor Alerts',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#1565C0',
      sound:            'default',
    });
  }
}

async function _sendLocalNotification(visitor) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 Visitor at Gate`,
        body:  `${visitor.name} wants to visit flat ${visitor.flatNumber}. Purpose: ${visitor.purpose}`,
        sound: 'default',
        data:  { visitorId: visitor._id },
        ...(Platform.OS === 'android' && { channelId: 'visitor-alerts' }),
      },
      trigger: null, // fire immediately
    });
  } catch (err) {
    console.warn('[Notifications] scheduleNotificationAsync failed:', err.message);
  }
}