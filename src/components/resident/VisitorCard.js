// src/components/resident/VisitorCard.js
import React, { useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Image,
  Modal, StatusBar, Dimensions,
} from 'react-native';
import { Surface, Text, Chip, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { VISITOR_STATUS } from '../../constants';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const STATUS_CONFIG = {
  [VISITOR_STATUS.PENDING]:     { label: 'Pending',      color: '#F9A825', icon: 'time-outline' },
  [VISITOR_STATUS.APPROVED]:    { label: 'Approved',     color: '#2E7D32', icon: 'checkmark-circle-outline' },
  [VISITOR_STATUS.REJECTED]:    { label: 'Rejected',     color: '#C62828', icon: 'close-circle-outline' },
  [VISITOR_STATUS.CHECKED_IN]:  { label: 'Checked In',   color: '#1565C0', icon: 'enter-outline' },
  [VISITOR_STATUS.CHECKED_OUT]: { label: 'Checked Out',  color: '#546E7A', icon: 'exit-outline' },
};

// ── Full-screen photo viewer ───────────────────────────────────────────────────
function PhotoViewer({ visible, uri, name, onClose }) {
  if (!uri) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
      <View style={photoStyles.overlay}>
        {/* Close button */}
        <TouchableOpacity style={photoStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Visitor name label */}
        {name ? (
          <Text style={photoStyles.nameLabel}>{name}</Text>
        ) : null}

        {/* Full-size photo */}
        <Image
          source={{ uri }}
          style={photoStyles.fullImage}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
}

const photoStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 8,
  },
  nameLabel: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 60,
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  fullImage: {
    width: SCREEN_W,
    height: SCREEN_H * 0.75,
  },
});

// ── VisitorCard ────────────────────────────────────────────────────────────────
export default function VisitorCard({ visitor, onApprove, onReject }) {
  const { colors } = useTheme();
  const [photoVisible, setPhotoVisible] = useState(false);

  const cfg = STATUS_CONFIG[visitor.status] ?? STATUS_CONFIG[VISITOR_STATUS.PENDING];

  const formattedDate = visitor.createdAt
    ? new Date(visitor.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

  const isPending = visitor.status === VISITOR_STATUS.PENDING;

  return (
    <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={2}>
      {/* Header row */}
      <View style={styles.header}>
        {visitor.photoUrl ? (
          <TouchableOpacity onPress={() => setPhotoVisible(true)} activeOpacity={0.85}>
            <Image source={{ uri: visitor.photoUrl }} style={styles.avatarPhoto} />
            {/* Small magnify hint */}
            <View style={styles.zoomBadge}>
              <Ionicons name="expand-outline" size={9} color="#fff" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name="account-outline" size={20} color={colors.primary} />
          </View>
        )}

        <View style={styles.info}>
          <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '700' }}>
            {visitor.name}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
            {visitor.mobile}
          </Text>
        </View>

        {/* Status chip */}
        <Chip
          compact
          icon={() => <Ionicons name={cfg.icon} size={12} color={cfg.color} />}
          style={[styles.chip, { backgroundColor: cfg.color + '1A' }]}
          textStyle={{ color: cfg.color, fontSize: 11, fontWeight: '700' }}
        >
          {cfg.label}
        </Chip>
      </View>

      {/* Purpose row */}
      <View style={styles.row}>
        <Ionicons name="clipboard-outline" size={14} color={colors.onSurfaceVariant} />
        <Text variant="bodySmall" style={[styles.rowText, { color: colors.onSurfaceVariant }]}>
          {visitor.purpose}
        </Text>
      </View>

      {/* Date row */}
      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={14} color={colors.onSurfaceVariant} />
        <Text variant="bodySmall" style={[styles.rowText, { color: colors.onSurfaceVariant }]}>
          {formattedDate}
        </Text>
      </View>

      {/* Action buttons — only for pending */}
      {isPending && (onApprove || onReject) && (
        <View style={styles.actions}>
          {onReject && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#C6282812' }]}
              onPress={onReject}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={16} color="#C62828" />
              <Text style={[styles.actionLabel, { color: '#C62828' }]}>Reject</Text>
            </TouchableOpacity>
          )}
          {onApprove && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#2E7D3212' }]}
              onPress={onApprove}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark" size={16} color="#2E7D32" />
              <Text style={[styles.actionLabel, { color: '#2E7D32' }]}>Approve</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Full-screen photo viewer */}
      <PhotoViewer
        visible={photoVisible}
        uri={visitor.photoUrl}
        name={visitor.name}
        onClose={() => setPhotoVisible(false)}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    padding: 2,
  },
  info: { flex: 1 },
  chip: { borderRadius: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 2,
  },
  rowText: { flex: 1 },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionLabel: { fontSize: 13, fontWeight: '700' },
}); 