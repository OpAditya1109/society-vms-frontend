// src/components/resident/ComplaintCard.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, Chip, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { COMPLAINT_STATUS } from '../../constants';

const STATUS_CONFIG = {
  [COMPLAINT_STATUS.OPEN]:        { label: 'Open',        color: '#C62828', icon: 'alert-circle-outline' },
  [COMPLAINT_STATUS.IN_PROGRESS]: { label: 'In Progress', color: '#F9A825', icon: 'hourglass-outline' },
  [COMPLAINT_STATUS.RESOLVED]:    { label: 'Resolved',    color: '#2E7D32', icon: 'checkmark-circle-outline' },
  [COMPLAINT_STATUS.CLOSED]:      { label: 'Closed',      color: '#546E7A', icon: 'lock-closed-outline' },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: '#546E7A' },
  medium: { label: 'Medium', color: '#F9A825' },
  high:   { label: 'High',   color: '#E65100' },
  urgent: { label: 'Urgent', color: '#C62828' },
};

/**
 * ComplaintCard — displays a single complaint with status badge.
 *
 * @param {object} props
 * @param {object} props.complaint
 */
export default function ComplaintCard({ complaint }) {
  const { colors } = useTheme();
  const cfg = STATUS_CONFIG[complaint.status] ?? STATUS_CONFIG[COMPLAINT_STATUS.OPEN];
  const priorityCfg = PRIORITY_CONFIG[complaint.priority] ?? PRIORITY_CONFIG.medium;

  const formattedDate = complaint.createdAt
    ? new Date(complaint.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

  return (
    <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={2}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <View style={[styles.iconCircle, { backgroundColor: cfg.color + '1A' }]}>
          <Ionicons name={cfg.icon} size={18} color={cfg.color} />
        </View>
        <Text
          variant="titleSmall"
          style={{ flex: 1, color: colors.onSurface, fontWeight: '700' }}
          numberOfLines={2}
        >
          {complaint.title}
        </Text>
        <Chip
          compact
          style={[styles.chip, { backgroundColor: cfg.color + '1A' }]}
          textStyle={{ color: cfg.color, fontSize: 10, fontWeight: '700' }}
        >
          {cfg.label}
        </Chip>
      </View>

      {/* Category + priority row */}
      <View style={styles.metaRow}>
        {complaint.category && (
          <View style={styles.tag}>
            <Ionicons name="pricetag-outline" size={11} color={colors.onSurfaceVariant} />
            <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, marginLeft: 3 }}>
              {complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)}
            </Text>
          </View>
        )}
        {complaint.priority && (
          <View style={[styles.priorityBadge, { backgroundColor: priorityCfg.color + '18', borderColor: priorityCfg.color + '40' }]}>
            <View style={[styles.priorityDot, { backgroundColor: priorityCfg.color }]} />
            <Text variant="labelSmall" style={{ color: priorityCfg.color, fontWeight: '700', fontSize: 10 }}>
              {priorityCfg.label}
            </Text>
          </View>
        )}
      </View>

      {/* Attachment indicator */}
      {complaint.attachmentUrl && (
        <View style={styles.row}>
          <Ionicons name="image-outline" size={12} color={colors.onSurfaceVariant} />
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft: 4 }}>
            Photo attached
          </Text>
        </View>
      )}

      {/* Admin note */}
      {complaint.adminNote && (
        <View style={[styles.adminNote, { backgroundColor: colors.primaryContainer }]}>
          <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
          <Text variant="bodySmall" style={{ color: colors.onPrimaryContainer, flex: 1, marginLeft: 6, fontStyle: 'italic' }}>
            <Text style={{ fontWeight: '700', fontStyle: 'normal' }}>Admin: </Text>
            {complaint.adminNote}
          </Text>
        </View>
      )}

      {/* Date */}
      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={12} color={colors.onSurfaceVariant} />
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft: 4 }}>
          {formattedDate}
        </Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 14, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chip: { borderRadius: 20, alignSelf: 'flex-start' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 2, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center' },
  priorityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
  },
  priorityDot: { width: 7, height: 7, borderRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 2 },
  adminNote: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 10, borderRadius: 10, gap: 4,
  },
});