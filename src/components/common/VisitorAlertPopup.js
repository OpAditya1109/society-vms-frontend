// src/components/common/VisitorAlertPopup.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated, View, StyleSheet, Image, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { visitorService } from '../../api/services/visitorService';
import { QUERY_KEYS } from '../../constants';

export default function VisitorAlertPopup({ visitor, onDismiss, onApproved, onRejected }) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // ── Animate card in/out ────────────────────────────────────────────────────
  useEffect(() => {
    if (visitor) {
      setRejectionReason('');
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 70,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visitor]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: () => visitorService.approveVisitor(visitor._id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VISITORS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD('resident') });
      onApproved?.(data?.data ?? visitor);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      visitorService.rejectVisitor(
        visitor._id,
        rejectionReason.trim() || 'Rejected by resident.',
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VISITORS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD('resident') });
      setRejectModalVisible(false);
      onRejected?.();
    },
  });

  const isLoading = approveMutation.isPending || rejectMutation.isPending;

  if (!visitor) return null;

  return (
    // Outer Modal — covers full screen, blocks ALL touches underneath
    <Modal
      visible={!!visitor}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {}} // empty — user MUST tap a button
    >
      {/* Dark backdrop — does nothing on press, intentionally blocking */}
      <View style={styles.backdrop}>

        {/* Animated card */}
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.surface },
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Blue accent strip */}
          <View style={styles.accentStrip} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text style={styles.badgeText}>VISITOR AT GATE</Text>
            </View>
            {/* X button only works if nothing is loading */}
            <TouchableOpacity
              onPress={onDismiss}
              disabled={isLoading}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={22} color={isLoading ? colors.outline : colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Visitor info */}
          <View style={styles.body}>
            {visitor.photoUrl ? (
              <Image source={{ uri: visitor.photoUrl }} style={styles.photo} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name="person" size={30} color={colors.primary} />
              </View>
            )}

            <View style={styles.info}>
              <Text style={[styles.visitorName, { color: colors.onSurface }]} numberOfLines={1}>
                {visitor.name}
              </Text>
              <View style={styles.detailRow}>
                <Ionicons name="clipboard-outline" size={13} color={colors.onSurfaceVariant} />
                <Text style={[styles.detailText, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                  {visitor.purpose}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="home-outline" size={13} color={colors.onSurfaceVariant} />
                <Text style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
                  Flat {visitor.flatNumber}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={13} color={colors.onSurfaceVariant} />
                <Text style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
                  {visitor.mobile}
                </Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => setRejectModalVisible(true)}
              disabled={isLoading}
              activeOpacity={0.75}
            >
              <Ionicons name="close-circle" size={18} color="#C62828" />
              <Text style={[styles.actionLabel, { color: '#C62828' }]}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn, isLoading && { opacity: 0.7 }]}
              onPress={() => approveMutation.mutate()}
              disabled={isLoading}
              activeOpacity={0.75}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={[styles.actionLabel, { color: '#fff' }]}>
                {approveMutation.isPending ? 'Approving…' : 'Approve'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* ── Reject reason bottom sheet ──────────────────────────────────────── */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !rejectMutation.isPending && setRejectModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.rejectBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Tap outside sheet to close */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => !rejectMutation.isPending && setRejectModalVisible(false)}
            activeOpacity={1}
          />
          <View style={[styles.rejectSheet, { backgroundColor: colors.surface }]}>
            {/* Handle bar */}
            <View style={[styles.handleBar, { backgroundColor: colors.outlineVariant }]} />

            <Text style={[styles.rejectTitle, { color: colors.onSurface }]}>
              Reason for Rejection
            </Text>
            <Text style={[styles.rejectSubtitle, { color: colors.onSurfaceVariant }]}>
              Rejecting <Text style={{ fontWeight: '700', color: colors.onSurface }}>{visitor.name}</Text>'s request
            </Text>

            <TextInput
              style={[
                styles.rejectInput,
                { color: colors.onSurface, borderColor: colors.outline, backgroundColor: colors.background },
              ]}
              placeholder="e.g. Unknown visitor, not expected today"
              placeholderTextColor={colors.onSurfaceVariant}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
              autoFocus
            />

            <View style={styles.rejectActions}>
              <TouchableOpacity
                style={[styles.rejectCancelBtn, { borderColor: colors.outline }]}
                onPress={() => setRejectModalVisible(false)}
                disabled={rejectMutation.isPending}
              >
                <Text style={{ color: colors.onSurfaceVariant, fontWeight: '600', fontSize: 14 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectConfirmBtn, rejectMutation.isPending && { opacity: 0.7 }]}
                onPress={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                  {rejectMutation.isPending ? 'Rejecting…' : 'Confirm Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ── Full-screen backdrop — blocks all touches ──────────────────────────────
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',   // ← centers card vertically
    alignItems: 'center',       // ← centers card horizontally
    paddingHorizontal: 20,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  accentStrip: {
    height: 5,
    backgroundColor: '#1565C0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1565C0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 5,
  },
  visitorName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginHorizontal: 18,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: 13,
  },
  rejectBtn: {
    backgroundColor: '#C6282810',
    borderWidth: 1.5,
    borderColor: '#C6282840',
  },
  approveBtn: {
    backgroundColor: '#1565C0',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Reject bottom sheet ────────────────────────────────────────────────────
  rejectBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  rejectSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 16,
    gap: 14,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  rejectTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  rejectSubtitle: {
    fontSize: 13,
    marginTop: -6,
  },
  rejectInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  rejectActions: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectCancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectConfirmBtn: {
    flex: 1,
    backgroundColor: '#C62828',
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});