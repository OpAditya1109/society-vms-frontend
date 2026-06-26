// src/components/guard/VisitorLogCard.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { VISITOR_STATUS } from '../../constants';

function statusConfig(status, colors) {
  switch (status) {
    case VISITOR_STATUS.PENDING:
      return { bg: '#FFF8E1', text: '#F9A825', icon: 'time-outline' };
    case VISITOR_STATUS.APPROVED:
      return { bg: '#E8F5E9', text: '#2E7D32', icon: 'checkmark-circle-outline' };
    case VISITOR_STATUS.REJECTED:
      return { bg: '#FDECEA', text: '#C62828', icon: 'close-circle-outline' };
    case VISITOR_STATUS.CHECKED_IN:
      return { bg: '#E3F2FD', text: '#1565C0', icon: 'log-in-outline' };
    case VISITOR_STATUS.CHECKED_OUT:
      return { bg: colors.surfaceVariant, text: colors.onSurfaceVariant, icon: 'log-out-outline' };
    default:
      return { bg: colors.surfaceVariant, text: colors.onSurfaceVariant, icon: 'help-circle-outline' };
  }
}

function formatTime(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function InfoPill({ icon, label, value, colors }) {
  if (!value) return null;
  return (
    <View style={styles.infoPill}>
      <Ionicons name={icon} size={13} color={colors.onSurfaceVariant} />
      <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }} numberOfLines={1}>
        <Text style={{ fontWeight: '600', color: colors.onSurface }}>{label}: </Text>
        {value}
      </Text>
    </View>
  );
}

/**
 * VisitorLogCard — single visitor log entry card for guard.
 *
 * @param {object}   props.visitor      Visitor document from API
 * @param {function} [props.onPress]
 * @param {boolean}  [props.squareBottom] Flatten bottom corners (used when a
 *                                        checkout action bar is attached directly below)
 */
export default function VisitorLogCard({ visitor, onPress, squareBottom = false }) {
  const { colors } = useTheme();
  const sc = statusConfig(visitor.status, colors);
  const entryTime = formatTime(visitor.checkInTime ?? visitor.createdAt);
  const entryDate = formatDate(visitor.createdAt);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <Surface
        style={[
          styles.surface,
          { backgroundColor: colors.surface },
          squareBottom && styles.surfaceSquareBottom,
        ]}
        elevation={1}
      >
        {/* Header: name + status */}
        <View style={styles.headerRow}>
          <View style={styles.nameBlock}>
            <View style={[styles.avatar, { backgroundColor: '#E65100' + '1A' }]}>
              {visitor.photoUrl ? (
                <Image source={{ uri: visitor.photoUrl }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="account-outline" size={18} color="#E65100" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                variant="titleSmall"
                style={[styles.name, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {visitor.name}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                {visitor.mobile}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Ionicons name={sc.icon} size={12} color={sc.text} />
            <Text
              style={[styles.statusText, { color: sc.text }]}
              numberOfLines={1}
            >
              {visitor.status?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Info grid */}
        <View style={styles.infoGrid}>
          <InfoPill icon="home-outline"      label="Flat"    value={visitor.flatNumber}  colors={colors} />
          <InfoPill icon="briefcase-outline" label="Purpose" value={visitor.purpose}     colors={colors} />
          {entryTime && (
            <InfoPill
              icon="time-outline"
              label="Entry"
              value={`${entryTime} · ${entryDate}`}
              colors={colors}
            />
          )}
          {visitor.residentId && (
            <InfoPill
              icon="person-circle-outline"
              label="Resident"
              value={`${visitor.residentId.firstName ?? ''} ${visitor.residentId.lastName ?? ''}`.trim()}
              colors={colors}
            />
          )}
        </View>

        {onPress && (
          <View style={styles.viewRow}>
            <Text variant="labelSmall" style={{ color: '#E65100' }}>View Details</Text>
            <Ionicons name="chevron-forward" size={14} color="#E65100" />
          </View>
        )}
      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  surface: { borderRadius: 14, padding: 14, gap: 10 },
  surfaceSquareBottom: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  name: { fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    flexShrink: 0,
  },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  infoGrid: { gap: 4 },
  infoPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
});