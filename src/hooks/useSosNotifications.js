// src/hooks/useSosNotifications.js
/**
 * useSosNotifications
 *
 * Mirrors useVisitorNotifications, but for the GUARD (and ADMIN) side:
 *  1. Connects to the backend via Socket.io and joins the society room
 *  2. Listens for `sos_triggered` events and surfaces a full-screen,
 *     blocking alert popup — same UX as the resident's "Visitor at Gate" card
 *  3. Fires an Expo local notification so the guard is alerted even if the
 *     app is backgrounded
 *
 * USAGE — mount once in RootNavigator (inside NavigationContainer):
 *   const { pendingSos, dismissSos } = useSosNotifications();
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform, AppState } from 'react-native';
import { io }                 from 'socket.io-client';
import * as Notifications     from 'expo-notifications';
import * as Device            from 'expo-device';
import { useSelector }        from 'react-redux';
import { useQueryClient }     from '@tanstack/react-query';
import { selectCurrentUser, selectIsAuthenticated } from '../store/slices/authSlice';
import { ROLES }              from '../constants';

const SOCKET_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api', '') ??
  'http://localhost:5001';

export function useSosNotifications() {
  const user            = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const queryClient     = useQueryClient();

  // The SOS alert that should be shown in the blocking popup right now
  const [pendingSos, setPendingSos] = useState(null);

  const socketRef = useRef(null);
  const appState  = useRef(AppState.currentState);

  const isGuardOrAdmin = user?.role === ROLES.GUARD || user?.role === ROLES.ADMIN;

  // ── Request notification permission ─────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !isGuardOrAdmin) return;
    _registerPushNotifications();
  }, [isAuthenticated, isGuardOrAdmin]);

  // ── Socket connection ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?._id || !isGuardOrAdmin) return;

    const socket = io(SOCKET_URL, {
      transports:       ['websocket'],
      reconnection:     true,
      reconnectionDelay: 1_500,
    });

    socket.on('connect', () => {
      console.log('[Socket] SOS listener connected', socket.id);
      socket.emit('register', {
        userId:    user._id,
        societyId: user.societyId,
      });
    });

    socket.on('sos_triggered', ({ alert }) => {
      console.log('[Socket] sos_triggered', alert);
      // Refresh the SOS list/badge in the background
      queryClient.invalidateQueries({ queryKey: ['sos-alerts'] });
      // Show the blocking popup card
      setPendingSos(alert);
      // Also fire a local push notification (works in background)
      _sendLocalNotification(alert);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] SOS listener disconnected', reason);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?._id, user?.societyId, isGuardOrAdmin]);

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

  const dismissSos = useCallback(() => setPendingSos(null), []);

  return { pendingSos, dismissSos };
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
    await Notifications.setNotificationChannelAsync('sos-alerts', {
      name:              'SOS Alerts',
      importance:        Notifications.AndroidImportance.MAX,
      vibrationPattern:  [0, 400, 200, 400, 200, 400],
      lightColor:        '#C62828',
      sound:             'default',
    });
  }
}

async function _sendLocalNotification(alert) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title:  `🆘 SOS Alert — Flat ${alert.flatNumber ?? alert.resident?.flatNumber ?? ''}`,
        body:   alert.message || 'Emergency! Immediate assistance needed.',
        sound:  'default',
        data:   { sosId: alert._id },
        ...(Platform.OS === 'android' && { channelId: 'sos-alerts' }),
      },
      trigger: null, // fire immediately
    });
  } catch (err) {
    console.warn('[Notifications] scheduleNotificationAsync failed:', err.message);
  }
}