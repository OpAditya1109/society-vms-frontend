// src/components/admin/GuardCard.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const DUTY_STATUS_META = {
  active:   { label: 'On Duty',    bg: '#E8F5E9', text: '#2E7D32', dot: '#4CAF50', icon: 'shield-checkmark' },
  inactive: { label: 'Off Duty',   bg: '#FAFAFA', text: '#9E9E9E', dot: '#BDBDBD', icon: 'shield-outline' },
  onBreak:  { label: 'On Break',   bg: '#FFF3E0', text: '#E65100', dot: '#FF9800', icon: 'hourglass-outline' },
};

/**
 * GuardCard - Display guard info with duty status
 * 
 * Props:
 *   guard       – guard object from API
 *   onPress(guard) – callback when card is tapped for detail view
 */
export default function GuardCard({ guard, onPress }) {
  const dutyMeta = DUTY_STATUS_META[guard.dutyStatus] ?? DUTY_STATUS_META.inactive;
  const initials = [guard.firstName?.[0], guard.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';
  
  // For display purposes
  const totalVisitors = guard.visitorsLogged ?? 0;
  const sosResponses = guard.sosResponded ?? 0;
  const avgResponse = guard.avgResponseTime ? `${guard.avgResponseTime}m` : 'N/A';

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={() => onPress?.(guard)}
    >
      <Surface style={styles.card} elevation={1}>
        {/* Top row: avatar + info + duty status */}
        <View style={styles.topRow}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: '#E65100' + '18' }]}>
            <Text style={[styles.avatarText, { color: '#E65100' }]}>{initials}</Text>
          </View>

          {/* Info */}
          <View style={styles.body}>
            <Text style={styles.name}>
              {guard.firstName} {guard.lastName}
            </Text>
            {guard.mobile ? (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={12} color="#9E9E9E" />
                <Text style={styles.sub}>{guard.mobile}</Text>
              </View>
            ) : null}
            {guard.email ? (
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={12} color="#9E9E9E" />
                <Text style={styles.sub} numberOfLines={1}>{guard.email}</Text>
              </View>
            ) : null}
            {guard.shift ? (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={12} color="#9E9E9E" />
                <Text style={styles.sub}>{guard.shift}</Text>
              </View>
            ) : null}
          </View>

          {/* Duty Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: dutyMeta.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: dutyMeta.dot }]} />
            <Text style={[styles.statusText, { color: dutyMeta.text }]}>
              {dutyMeta.label}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={14} color="#1565C0" />
            <Text style={styles.statLabel}>Visitors</Text>
            <Text style={[styles.statValue, { color: '#1565C0' }]}>{totalVisitors}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Ionicons name="alert-circle-outline" size={14} color="#C62828" />
            <Text style={styles.statLabel}>SOS</Text>
            <Text style={[styles.statValue, { color: '#C62828' }]}>{sosResponses}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Ionicons name="timer-outline" size={14} color="#7B1FA2" />
            <Text style={styles.statLabel}>Avg Response</Text>
            <Text style={[styles.statValue, { color: '#7B1FA2' }]}>{avgResponse}</Text>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 17, fontWeight: '800' },
  body: { flex: 1, gap: 3 },
  name: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sub: { fontSize: 12, color: '#757575', flex: 1 },
  
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '600' },
  statValue: { fontSize: 14, fontWeight: '800' },
  divider: { width: 1, height: 30, backgroundColor: '#F5F5F5' },
});