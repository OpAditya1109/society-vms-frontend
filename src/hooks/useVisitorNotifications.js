// src/hooks/useVisitorNotifications.js
/**
 * useVisitorNotifications
 *
 * Connects to the backend via Socket.io and:
 *  1. Registers push-notification token with Expo
 *  2. Listens for `new_visitor` events and surfaces an in-app alert popup
 *  3. Dispatches an Expo local notification so the alert works when the app
 *     is backgrounded (foreground: popup card, background/killed: system notif)
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
import { ROLES }              from '../constants';

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

  const socketRef = useRef(null);
  const appState  = useRef(AppState.currentState);

  // ── Request notification permission + register push token ─────────────────
  useEffect(() => {
    if (!isAuthenticated || user?.role !== ROLES.RESIDENT) return;
    _registerPushNotifications();
  }, [isAuthenticated, user?.role]);

  // ── Socket connection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?._id || user?.role !== ROLES.RESIDENT) return;

    const socket = io(SOCKET_URL, {
      transports:       ['websocket'],
      reconnection:     true,
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
      // Show popup card on screen
      setPendingVisitor(visitor);
      // Also fire a local push notification (works in background)
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
  }, [isAuthenticated, user?._id, user?.societyId, user?.role]);

  // ── App state handler: reconnect on foreground ────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        if (socketRef.current && !socketRef.current.connected) {
          socketRef.current.connect();
        }
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  const dismissVisitor = useCallback(() => setPendingVisitor(null), []);

  return { pendingVisitor, dismissVisitor };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
      name:              'Visitor Alerts',
      importance:        Notifications.AndroidImportance.MAX,
      vibrationPattern:  [0, 250, 250, 250],
      lightColor:        '#1565C0',
      sound:             'default',
    });
  }
}

async function _sendLocalNotification(visitor) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title:  `🔔 Visitor at Gate`,
        body:   `${visitor.name} wants to visit flat ${visitor.flatNumber}. Purpose: ${visitor.purpose}`,
        sound:  'default',
        data:   { visitorId: visitor._id },
        ...(Platform.OS === 'android' && { channelId: 'visitor-alerts' }),
      },
      trigger: null, // fire immediately
    });
  } catch (err) {
    console.warn('[Notifications] scheduleNotificationAsync failed:', err.message);
  }
}