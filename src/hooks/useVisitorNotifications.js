// src/hooks/useVisitorNotifications.js
/**
 * useVisitorNotifications
 *
 * 1. Registers Expo push token with backend on mount (killed-app delivery)
 * 2. Connects via Socket.IO for real-time events (foreground / background)
 * 3. On `new_visitor` socket event: shows popup + fires local notification
 * 4. Persists pending visitor to AsyncStorage — restored after app kill
 * 5. On foreground return: re-checks API for any missed visitors
 * 6. Handles notification taps (app killed) — restores popup via data payload
 *
 * Mount once in RootNavigator (inside NavigationContainer):
 *   const { pendingVisitor, dismissVisitor } = useVisitorNotifications();
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform, AppState }   from 'react-native';
import { io }                   from 'socket.io-client';
import * as Notifications       from 'expo-notifications';
import * as Device              from 'expo-device';
import { useSelector }          from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from '../store/slices/authSlice';
import { ROLES, VISITOR_STATUS }  from '../constants';
import { visitorService }         from '../api/services/visitorService';
import { authService }            from '../api/services/authService';
import {
  savePendingVisitor,
  getSavedPendingVisitor,
  clearPendingVisitor,
} from '../utils/storage';

// ── Show notification banner even when app is foregrounded ────────────────────
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

  const [pendingVisitor, setPendingVisitor] = useState(null);

  const socketRef  = useRef(null);
  const appState   = useRef(AppState.currentState);
  const isMounted  = useRef(true);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showVisitor = useCallback((visitor) => {
    if (!isMounted.current) return;
    setPendingVisitor(visitor);
    savePendingVisitor(visitor).catch(() => {});
  }, []);

  const dismissVisitor = useCallback(() => {
    setPendingVisitor(null);
    clearPendingVisitor().catch(() => {});
  }, []);

  // ── On mount: restore any visitor pending when app was killed ──────────────
  useEffect(() => {
    if (!isAuthenticated || user?.role !== ROLES.RESIDENT) return;

    (async () => {
      try {
        const saved = await getSavedPendingVisitor();

        if (saved) {
          try {
            const result = await visitorService.getVisitorById(saved._id);
            const fresh  = result?.data ?? result;
            if (fresh?.status === VISITOR_STATUS.PENDING) {
              if (isMounted.current) showVisitor(fresh);
              return;
            } else {
              await clearPendingVisitor();
            }
          } catch {
            if (isMounted.current) showVisitor(saved);
            return;
          }
        }

        await _fetchAndShowPendingVisitor(showVisitor);
      } catch (err) {
        console.warn('[VisitorNotifications] restore error:', err?.message);
      }
    })();

    return () => { isMounted.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?._id, user?.role]);

  // ── Register push token with Expo + save to backend ───────────────────────
  useEffect(() => {
    if (!isAuthenticated || user?.role !== ROLES.RESIDENT) return;
    _registerAndSavePushToken();
  }, [isAuthenticated, user?.role]);

  // ── Handle notification tap when app was killed ────────────────────────────
  // When a user taps the OS push notification and the app opens from killed
  // state, this listener fires with the notification data so we can restore
  // the popup instead of leaving the user on a blank screen.
  useEffect(() => {
    if (!isAuthenticated || user?.role !== ROLES.RESIDENT) return;

    const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data;

      if (data?.type === 'visitor' && data?.visitorId) {
        try {
          const result = await visitorService.getVisitorById(data.visitorId);
          const visitor = result?.data ?? result;
          if (visitor?.status === VISITOR_STATUS.PENDING) {
            showVisitor(visitor);
          }
        } catch (err) {
          console.warn('[VisitorNotifications] tap restore error:', err?.message);
        }
      }
    });

    return () => sub.remove();
  }, [isAuthenticated, user?.role, showVisitor]);

  // ── Socket connection ──────────────────────────────────────────────────────
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
      // Local notification covers background state
      // (killed-state is handled by backend → Expo Push API → OS)
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

  // ── App state: reconnect + re-check on foreground ─────────────────────────
  useEffect(() => {
    if (!isAuthenticated || user?.role !== ROLES.RESIDENT) return;

    const sub = AppState.addEventListener('change', async (next) => {
      const wasBackground = appState.current.match(/inactive|background/);
      appState.current = next;

      if (wasBackground && next === 'active') {
        if (socketRef.current && !socketRef.current.connected) {
          socketRef.current.connect();
        }

        setPendingVisitor((current) => {
          if (!current) {
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

async function _fetchAndShowPendingVisitor(showVisitor) {
  try {
    const result   = await visitorService.getVisitors({ status: VISITOR_STATUS.PENDING });
    const visitors = result?.data ?? result ?? [];
    if (Array.isArray(visitors) && visitors.length > 0) {
      showVisitor(visitors[0]);
    }
  } catch (err) {
    console.warn('[VisitorNotifications] fetch pending error:', err?.message);
  }
}

/**
 * Request permission, get Expo push token, save to backend.
 * Must be called after the user is authenticated so the API call
 * has a valid JWT in the interceptor.
 */
async function _registerAndSavePushToken() {
  if (!Device.isDevice) {
    // Simulators/emulators cannot receive real push notifications
    console.log('[Push] Skipping — not a real device');
    return;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permission denied');
    return;
  }

  // Create Android notification channels
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('visitor-alerts', {
      name:             'Visitor Alerts',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#1565C0',
      sound:            'default',
    });

    await Notifications.setNotificationChannelAsync('default', {
      name:      'General',
      importance: Notifications.AndroidImportance.HIGH,
      sound:     'default',
    });
  }

  try {
    // projectId is required — grab it from app.json > extra.eas.projectId
    // Run `npx eas init` once to generate this
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    });

    const token = tokenData.data;
    console.log('[Push] Expo token:', token);

    // Persist to backend — interceptors.js adds the JWT automatically
    await authService.updatePushToken(token);
  } catch (err) {
    console.warn('[Push] Token registration failed:', err?.message);
  }
}

/**
 * Fire a local notification for background state.
 * Killed-state delivery is handled by the backend → Expo Push API → OS.
 */
async function _sendLocalNotification(visitor) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Visitor at Gate',
        body:  `${visitor.name} is here for Flat ${visitor.flatNumber}. Purpose: ${visitor.purpose}`,
        sound: 'default',
        data:  { type: 'visitor', visitorId: visitor._id },
        ...(Platform.OS === 'android' && { channelId: 'visitor-alerts' }),
      },
      trigger: null, // fire immediately
    });
  } catch (err) {
    console.warn('[Notifications] scheduleNotificationAsync failed:', err.message);
  }
}