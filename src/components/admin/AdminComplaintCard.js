// src/components/admin/AdminComplaintCard.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, Chip, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { COMPLAINT_STATUS } from '../../constants';

const STATUS_CONFIG = {
  [COMPLAINT_STATUS.OPEN]:        { label: 'Open',        color: '#C62828', icon: 'alert-circle-outline' },
  [COMPLAINT_STATUS.IN_PROGRESS]: { label: 'In Progress', color: '#F9A825', icon: 'hourglass-outline' },
  [COMPLAINT_STATUS.RESOLVED]:    { label: 'Resolved',    color: '#2E7D32', icon: 'checkmark-circle-outline' },
  [COMPLAINT_STATUS.CLOSED]:      { label: 'Closed',      color: '#546E7A', icon: 'lock-closed-outline' },
};

/**
 * AdminComplaintCard — complaint card with status update action.
 *
 * @param {object}   props.complaint
 * @param {function} props.onUpdateStatus   Called with (complaint)
 */
export default function AdminComplaintCard({ complaint, onUpdateStatus }) {
  const { colors } = useTheme();
  const cfg = STATUS_CONFIG[complaint.status] ?? STATUS_CONFIG[COMPLAINT_STATUS.OPEN];

  const formattedDate = complaint.createdAt
    ? new Date(complaint.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

  const residentName = complaint.residentId
    ? `${complaint.residentId.firstName ?? ''} ${complaint.residentId.lastName ?? ''}`.trim()
    : null;

  return (
    <Surface style={[styles.surface, { backgroundColor: colors.surface }]} elevation={1}>
      {/* Title + status */}
      <View style={styles.headerRow}>
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

      {/* Description */}
      {complaint.description && (
        <Text
          variant="bodySmall"
          style={{ color: colors.onSurfaceVariant }}
          numberOfLines={2}
        >
          {complaint.description}
        </Text>
      )}

      {/* Meta row */}
      <View style={styles.metaRow}>
        {residentName && (
          <View style={styles.metaItem}>
            <Ionicons name="account-outline" size={12} color={colors.onSurfaceVariant} />
            <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, marginLeft: 3 }}>
              {residentName}
            </Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={12} color={colors.onSurfaceVariant} />
          <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, marginLeft: 3 }}>
            {formattedDate}
          </Text>
        </View>
      </View>

      {/* Update status action */}
      <TouchableOpacity
        onPress={() => onUpdateStatus?.(complaint)}
        activeOpacity={0.7}
        style={[styles.actionBtn, { backgroundColor: '#4A148C' + '12' }]}
      >
        <Ionicons name="refresh-outline" size={14} color="#4A148C" />
        <Text style={{ color: '#4A148C', fontWeight: '700', fontSize: 12, marginLeft: 6 }}>
          Update Status
        </Text>
      </TouchableOpacity>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: { borderRadius: 20, alignSelf: 'flex-start' },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 2,
  },
});