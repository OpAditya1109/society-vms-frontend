// src/components/common/SosAlertPopup.js
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, View, StyleSheet, TouchableOpacity, Modal, Linking,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { useAcknowledgeSos, useResolveSos } from '../../hooks/useSos';

export default function SosAlertPopup({ alert, onDismiss, onAcknowledged, onResolved }) {
  const { colors } = useTheme();

  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const ringAnim    = useRef(new Animated.Value(0)).current; // expanding "siren" ring
  const glowAnim    = useRef(new Animated.Value(0)).current; // border glow pulse

  const [elapsed, setElapsed] = useState(0); // seconds since triggered

  // ── Entrance + continuous urgency animations ───────────────────────────────
  useEffect(() => {
    if (!alert) {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const ringLoop = Animated.loop(
      Animated.timing(ringAnim, { toValue: 1, duration: 1400, useNativeDriver: true })
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );
    ringAnim.setValue(0);
    ringLoop.start();
    glowLoop.start();

    return () => {
      ringLoop.stop();
      glowLoop.stop();
    };
  }, [alert]);

  // ── Live "time since triggered" ticker ─────────────────────────────────────
  useEffect(() => {
    if (!alert) return;
    const start = alert.createdAt ? new Date(alert.createdAt).getTime() : Date.now();
    setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    const id = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [alert]);

  const ackMutation = useAcknowledgeSos();
  const resMutation = useResolveSos();
  const isLoading = ackMutation.isPending || resMutation.isPending;

  if (!alert) return null;

  const resident = alert.resident ?? {};
  const flat = alert.flatNumber ?? resident.flatNumber ?? '—';
  const isAcknowledged = alert.status === 'acknowledged';

  const handleAcknowledge = () => ackMutation.mutate(alert._id, { onSuccess: () => onAcknowledged?.() });
  const handleResolve     = () => resMutation.mutate(alert._id, { onSuccess: () => onResolved?.() });

  const ringScale   = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.5, 0.15, 0] });
  const borderColor = glowAnim.interpolate({ inputRange: [0, 1], outputRange: ['#C6282855', '#C62828FF'] });

  return (
    <Modal
      visible={!!alert}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {}} // empty — guard MUST acknowledge or resolve
    >
      <View style={styles.backdrop}>
        {/*
          NOTE: borderColor is JS-driven (colors can't use the native driver),
          while scale/opacity below are native-driven. Mixing both on the same
          Animated.View causes:
          "Attempting to run JS driven animation on animated node that has
          been moved to native earlier by starting an animation with
          useNativeDriver: true"
          So the JS-driven glow lives on this OUTER plain Animated.View,
          and the native-driven scale/opacity live on the INNER one.
        */}
        <Animated.View style={[styles.card, { borderColor }]}>
          <Animated.View
            style={[
              styles.cardInner,
              { backgroundColor: colors.surface },
              { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
          {/* ── Hero header: siren ring + icon + headline ─────────────────── */}
          <View style={styles.hero}>
            <View style={styles.sirenWrap}>
              <Animated.View
                style={[styles.sirenRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
              />
              <View style={styles.sirenCore}>
                <Ionicons name="warning" size={26} color="#fff" />
              </View>
            </View>

            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>SOS EMERGENCY</Text>
              <View style={styles.timerRow}>
                <Ionicons name="time-outline" size={12} color="#FFD7D7" />
                <Text style={styles.timerText}>{formatElapsed(elapsed)} ago</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onDismiss}
              disabled={isLoading}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── Resident / location ──────────────────────────────────────── */}
          <View style={styles.body}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={26} color="#C62828" />
            </View>

            <View style={styles.info}>
              <Text style={[styles.residentName, { color: colors.onSurface }]} numberOfLines={1}>
                {resident.firstName || 'Resident'} {resident.lastName || ''}
              </Text>
              <View style={styles.detailRow}>
                <View style={styles.flatPill}>
                  <Ionicons name="home" size={12} color="#C62828" />
                  <Text style={styles.flatPillText}>Flat {flat}</Text>
                </View>
                {isAcknowledged && (
                  <View style={styles.ackPill}>
                    <Ionicons name="eye" size={12} color="#E65100" />
                    <Text style={styles.ackPillText}>Acknowledged</Text>
                  </View>
                )}
              </View>
              {!!resident.mobile && (
                <Text style={[styles.mobileText, { color: colors.onSurfaceVariant }]}>
                  {resident.mobile}
                </Text>
              )}
            </View>
          </View>

          {/* ── Message ──────────────────────────────────────────────────── */}
          <View style={styles.messageBox}>
            <Ionicons name="alert-circle" size={16} color="#B71C1C" style={{ marginTop: 1 }} />
            <Text style={styles.messageText}>
              {alert.message || 'Emergency! Immediate assistance needed.'}
            </Text>
          </View>

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <View style={styles.actions}>
            <View style={styles.actionsRow}>
              {!!resident.mobile && (
                <TouchableOpacity
                  style={[styles.iconActionBtn, { borderColor: '#1565C040' }]}
                  onPress={() => Linking.openURL(`tel:${resident.mobile}`).catch(() => {})}
                  activeOpacity={0.75}
                >
                  <Ionicons name="call" size={20} color="#1565C0" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.primaryActionBtn,
                  isAcknowledged ? styles.ackBtnDone : styles.ackBtn,
                  isLoading && { opacity: 0.7 },
                ]}
                onPress={handleAcknowledge}
                disabled={isLoading || isAcknowledged}
                activeOpacity={0.75}
              >
                <Ionicons name={isAcknowledged ? 'checkmark' : 'eye'} size={17} color={isAcknowledged ? '#2E7D32' : '#fff'} />
                <Text style={[styles.actionLabel, { color: isAcknowledged ? '#2E7D32' : '#fff' }]}>
                  {isAcknowledged ? 'Acknowledged' : ackMutation.isPending ? 'Acking…' : 'Acknowledge'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.resolveBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleResolve}
              disabled={isLoading}
              activeOpacity={0.75}
            >
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
              <Text style={[styles.actionLabel, { color: '#fff' }]}>
                {resMutation.isPending ? 'Resolving…' : 'Mark as Resolved'}
              </Text>
            </TouchableOpacity>
          </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function formatElapsed(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    elevation: 24,
    shadowColor: '#C62828',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  cardInner: {
    borderRadius: 22,
    overflow: 'hidden',
  },

  // ── Hero header ───────────────────────────────────────────────────────────
  hero: {
    backgroundColor: '#C62828',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  sirenWrap: {
    width: 48, height: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  sirenRing: {
    position: 'absolute',
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  sirenCore: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#B71C1C',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 4 },
  heroTitle: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.8 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { color: '#FFD7D7', fontSize: 12, fontWeight: '700' },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Body ──────────────────────────────────────────────────────────────────
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 4,
  },
  avatarCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FFEBEE',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, gap: 6 },
  residentName: { fontSize: 17, fontWeight: '800' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  flatPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFEBEE', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  flatPillText: { fontSize: 12, fontWeight: '700', color: '#C62828' },
  ackPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF3E0', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  ackPillText: { fontSize: 12, fontWeight: '700', color: '#E65100' },
  mobileText: { fontSize: 13, fontWeight: '600' },

  // ── Message ───────────────────────────────────────────────────────────────
  messageBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFF3F3',
    marginHorizontal: 18,
    marginTop: 14,
    borderRadius: 14,
    padding: 13,
  },
  messageText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#B71C1C', lineHeight: 20 },

  // ── Actions ───────────────────────────────────────────────────────────────
  actions: { padding: 16, gap: 10 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  iconActionBtn: {
    width: 50,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 13,
    borderWidth: 1.5,
    backgroundColor: '#1565C00C',
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 13,
  },
  ackBtn: { backgroundColor: '#E65100' },
  ackBtnDone: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1.5,
    borderColor: '#2E7D3240',
  },
  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#2E7D32',
    borderRadius: 13,
    paddingVertical: 14,
  },
  actionLabel: { fontSize: 14, fontWeight: '700' },
});