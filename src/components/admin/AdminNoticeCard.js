// src/components/admin/AdminNoticeCard.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, Chip, useTheme, IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { NOTICE_TYPE } from '../../constants';

const TYPE_CONFIG = {
  [NOTICE_TYPE.GENERAL]:     { label: 'General',     color: '#1565C0', icon: 'information-circle-outline' },
  [NOTICE_TYPE.MAINTENANCE]: { label: 'Maintenance', color: '#E65100', icon: 'construct-outline' },
  [NOTICE_TYPE.EMERGENCY]:   { label: 'Emergency',   color: '#C62828', icon: 'warning-outline' },
  [NOTICE_TYPE.EVENT]:       { label: 'Event',       color: '#2E7D32', icon: 'calendar-outline' },
};

/**
 * AdminNoticeCard — notice card with edit & delete actions for admin.
 *
 * @param {object}   props.notice
 * @param {function} props.onEdit
 * @param {function} props.onDelete
 * @param {boolean}  [props.deleteLoading]
 */
export default function AdminNoticeCard({ notice, onEdit, onDelete, deleteLoading }) {
  const { colors } = useTheme();
  const cfg = TYPE_CONFIG[notice.type] ?? TYPE_CONFIG[NOTICE_TYPE.GENERAL];

  const formattedDate = notice.createdAt
    ? new Date(notice.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

  return (
    <Surface style={[styles.surface, { backgroundColor: colors.surface }]} elevation={1}>
      <View style={[styles.accentBar, { backgroundColor: cfg.color }]} />
      <View style={styles.body}>
        {/* Header: type chip + action buttons */}
        <View style={styles.headerRow}>
          <Chip
            compact
            icon={() => <Ionicons name={cfg.icon} size={11} color={cfg.color} />}
            style={[styles.chip, { backgroundColor: cfg.color + '18' }]}
            textStyle={{ color: cfg.color, fontSize: 10, fontWeight: '700' }}
          >
            {cfg.label}
          </Chip>

          <View style={styles.actions}>
            {/* Edit button */}
            <IconButton
              icon="pencil-outline"
              iconColor={colors.primary}
              size={18}
              onPress={onEdit}
              style={styles.actionBtn}
            />
            {/* Delete button */}
            <IconButton
              icon="trash-outline"
              iconColor={colors.error}
              size={18}
              onPress={onDelete}
              disabled={deleteLoading}
              style={styles.actionBtn}
            />
          </View>
        </View>

        {/* Title */}
        <Text
          variant="titleSmall"
          style={{ color: colors.onSurface, fontWeight: '700' }}
          numberOfLines={2}
        >
          {notice.title}
        </Text>

        {/* Content preview */}
        {notice.content && (
          <Text
            variant="bodySmall"
            style={{ color: colors.onSurfaceVariant, marginTop: 2 }}
            numberOfLines={2}
          >
            {notice.content}
          </Text>
        )}

        {/* Date */}
        <View style={styles.footer}>
          <Ionicons name="calendar-outline" size={12} color={colors.onSurfaceVariant} />
          <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, marginLeft: 4 }}>
            {formattedDate}
          </Text>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: { width: 4 },
  body: {
    flex: 1,
    padding: 12,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: { borderRadius: 20 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: { margin: 0 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});