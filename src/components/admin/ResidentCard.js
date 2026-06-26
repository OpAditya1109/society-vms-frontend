// src/components/admin/ResidentCard.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const ROLE_META = {
  resident: { label: 'Resident', color: '#1565C0', icon: 'home-outline' },
  guard:    { label: 'Guard',    color: '#E65100', icon: 'shield-outline' },
  admin:    { label: 'Admin',    color: '#4A148C', icon: 'settings-outline' },
};

const STATUS_META = {
  pending:  { label: 'Pending',  bg: '#FFF3E0', text: '#E65100', dot: '#FF9800' },
  active:   { label: 'Active',   bg: '#E8F5E9', text: '#2E7D32', dot: '#4CAF50' },
  inactive: { label: 'Inactive', bg: '#FAFAFA', text: '#9E9E9E', dot: '#BDBDBD' },
};

/**
 * ResidentCard
 *
 * Props:
 *   resident        – user object from API
 *   onApprove(id)   – called when Approve tapped  (only shown if status=pending)
 *   onReject(id)    – called when Reject tapped   (only shown if status=pending)
 *   onDeactivate(id)– called when Deactivate tapped (only shown if status=active)
 *   onReactivate(id)– called when Reactivate tapped (only shown if status=inactive)
 *   onPress(resident)– tap anywhere on card for detail view
 *   loadingId       – id of the resident currently being mutated (shows spinner)
 */
export default function ResidentCard({
  resident,
  onApprove,
  onReject,
  onDeactivate,
  onReactivate,
  onPress,
  loadingId,
}) {
  const meta       = ROLE_META[resident.role] ?? ROLE_META.resident;
  const statusMeta = STATUS_META[resident.status] ?? STATUS_META.active;
  const initials   = [resident.firstName?.[0], resident.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';
  const isLoading  = loadingId === resident._id;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={() => onPress?.(resident)}
    >
      <Surface style={styles.card} elevation={1}>
        {/* Top row: avatar + info + role badge */}
        <View style={styles.topRow}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: meta.color + '18' }]}>
            <Text style={[styles.avatarText, { color: meta.color }]}>{initials}</Text>
          </View>

          {/* Info */}
          <View style={styles.body}>
            <Text style={styles.name}>
              {resident.firstName} {resident.lastName}
            </Text>
            {resident.flatNumber ? (
              <View style={styles.infoRow}>
                <Ionicons name="home-outline" size={12} color="#9E9E9E" />
                <Text style={styles.sub}>Flat {resident.flatNumber}</Text>
              </View>
            ) : null}
            {resident.mobile ? (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={12} color="#9E9E9E" />
                <Text style={styles.sub}>{resident.mobile}</Text>
              </View>
            ) : null}
            {resident.email ? (
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={12} color="#9E9E9E" />
                <Text style={styles.sub} numberOfLines={1}>{resident.email}</Text>
              </View>
            ) : null}
          </View>

          {/* Right column: role badge + status badge */}
          <View style={styles.badges}>
            <View style={[styles.roleBadge, { backgroundColor: meta.color + '15', borderColor: meta.color + '40' }]}>
              <Ionicons name={meta.icon} size={11} color={meta.color} />
              <Text style={[styles.roleText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusMeta.dot }]} />
              <Text style={[styles.statusText, { color: statusMeta.text }]}>
                {statusMeta.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Action buttons — shown only for residents, not guards/admins */}
        {resident.role === 'resident' && (
          <>
            {/* Pending → Approve / Reject */}
            {resident.status === 'pending' && (onApprove || onReject) && (
              <View style={styles.actions}>
                {onReject && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => onReject(resident._id)}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle-outline" size={15} color="#C62828" />
                    <Text style={[styles.actionText, { color: '#C62828' }]}>Reject</Text>
                  </TouchableOpacity>
                )}
                {onApprove && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => onApprove(resident._id)}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <Ionicons name="hourglass-outline" size={15} color="#fff" />
                    ) : (
                      <Ionicons name="checkmark-circle-outline" size={15} color="#fff" />
                    )}
                    <Text style={[styles.actionText, { color: '#fff' }]}>
                      {isLoading ? 'Approving…' : 'Approve'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Active → Deactivate */}
            {resident.status === 'active' && onDeactivate && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deactivateBtn, { flex: 1 }]}
                  onPress={() => onDeactivate(resident._id)}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="ban-outline" size={15} color="#E65100" />
                  <Text style={[styles.actionText, { color: '#E65100' }]}>
                    {isLoading ? 'Deactivating…' : 'Deactivate'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Inactive → Reactivate */}
            {resident.status === 'inactive' && onReactivate && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.reactivateBtn, { flex: 1 }]}
                  onPress={() => onReactivate(resident._id)}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-circle-outline" size={15} color="#1565C0" />
                  <Text style={[styles.actionText, { color: '#1565C0' }]}>
                    {isLoading ? 'Reactivating…' : 'Reactivate'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
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
  badges: { alignItems: 'flex-end', gap: 5 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleText: { fontSize: 11, fontWeight: '700' },
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

  // Action row
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionText: { fontSize: 13, fontWeight: '700' },
  approveBtn:    { backgroundColor: '#2E7D32' },
  rejectBtn:     { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2' },
  deactivateBtn: { backgroundColor: '#FFF3E0', borderWidth: 1, borderColor: '#FFE0B2' },
  reactivateBtn: { backgroundColor: '#E3F2FD', borderWidth: 1, borderColor: '#BBDEFB' },
});