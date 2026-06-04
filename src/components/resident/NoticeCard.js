// src/components/resident/NoticeCard.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, Chip, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { NOTICE_TYPE } from '../../constants';

const TYPE_CONFIG = {
  [NOTICE_TYPE.GENERAL]:     { label: 'General',     color: '#1565C0', icon: 'information-circle-outline' },
  [NOTICE_TYPE.MAINTENANCE]: { label: 'Maintenance', color: '#E65100', icon: 'construct-outline' },
  [NOTICE_TYPE.EMERGENCY]:   { label: 'Emergency',   color: '#C62828', icon: 'warning-outline' },
  [NOTICE_TYPE.EVENT]:       { label: 'Event',       color: '#2E7D32', icon: 'calendar-outline' },
};

/**
 * NoticeCard — displays a single society notice.
 *
 * @param {object}   props
 * @param {object}   props.notice
 * @param {function} [props.onPress]
 */
export default function NoticeCard({ notice, onPress }) {
  const { colors } = useTheme();
  const cfg = TYPE_CONFIG[notice.type] ?? TYPE_CONFIG[NOTICE_TYPE.GENERAL];

  const formattedDate = notice.createdAt
    ? new Date(notice.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={2}>
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: cfg.color }]} />

        <View style={styles.body}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <Text
              variant="titleSmall"
              style={{ flex: 1, color: colors.onSurface, fontWeight: '700' }}
              numberOfLines={2}
            >
              {notice.title}
            </Text>
            <Chip
              compact
              icon={() => <Ionicons name={cfg.icon} size={11} color={cfg.color} />}
              style={[styles.chip, { backgroundColor: cfg.color + '18' }]}
              textStyle={{ color: cfg.color, fontSize: 10, fontWeight: '700' }}
            >
              {cfg.label}
            </Chip>
          </View>

          {/* Content preview */}
          {notice.content && (
            <Text
              variant="bodySmall"
              style={{ color: colors.onSurfaceVariant, marginTop: 4 }}
              numberOfLines={2}
            >
              {notice.content}
            </Text>
          )}

          {/* Footer: date + chevron */}
          <View style={styles.footer}>
            <Ionicons name="calendar-outline" size={12} color={colors.onSurfaceVariant} />
            <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, marginLeft: 4 }}>
              {formattedDate}
            </Text>
            {onPress && (
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.onSurfaceVariant}
                style={styles.chevron}
              />
            )}
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    borderRadius: 4,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  chip: { borderRadius: 20 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  chevron: { marginLeft: 'auto' },
});