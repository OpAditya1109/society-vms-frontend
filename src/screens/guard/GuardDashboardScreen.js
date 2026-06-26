// src/screens/guard/GuardDashboardScreen.js
import React, { useCallback, useState } from 'react';
import {
  View, ScrollView, StyleSheet, RefreshControl,
  Switch, TouchableOpacity, TextInput, Modal, Alert,
} from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { useGuardDashboard } from '../../hooks/useGuardDashboard';
import {
  useActiveGuards,
  useUpdateGuardStatus,
  useGuardMessages,
  useMarkMessageRead,
} from '../../hooks/useGuards';
import DashboardStatCard from '../../components/guard/DashboardStatCard';
import VisitorLogCard from '../../components/guard/VisitorLogCard';
import { SkeletonDashboard, SkeletonList } from '../../components/resident/SkeletonCard';
import { EmptyState, ErrorState } from '../../components/common';

const GUARD_ACCENT = '#E65100';

// ── Message Card ──────────────────────────────────────────────────────────────
function MessageCard({ msg, onMarkRead }) {
  return (
    <Surface style={[styles.msgCard, !msg.isRead && styles.msgCardUnread]} elevation={2}>
      <View style={styles.msgCardHeader}>
        <View style={styles.msgAvatarWrap}>
          <Ionicons name="account-outline" size={18} color={GUARD_ACCENT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.msgFrom}>
            {msg.fromResident?.firstName} {msg.fromResident?.lastName}
            {msg.fromResident?.flatNumber ? ` · Flat ${msg.fromResident.flatNumber}` : ''}
          </Text>
          <Text style={styles.msgTime}>
            {new Date(msg.createdAt).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
        {!msg.isRead && (
          <TouchableOpacity
            style={styles.readBtn}
            onPress={() => onMarkRead(msg._id)}
          >
            <Ionicons name="checkmark-done" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.msgBody}>{msg.message}</Text>
    </Surface>
  );
}

// ── Status Message Modal ──────────────────────────────────────────────────────
function StatusMessageModal({ visible, current, onClose, onSave }) {
  const [text, setText] = useState(current ?? '');
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Set Status Message</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, marginBottom: 8 }}>
            Residents will see this message on their home screen.
          </Text>
          <TextInput
            style={[styles.msgInput, { borderColor: colors.outlineVariant, color: colors.onSurface, backgroundColor: colors.background }]}
            placeholder="e.g. Patrolling Block B. Call if urgent."
            placeholderTextColor={colors.onSurfaceVariant}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={200}
            numberOfLines={3}
          />
          <Text style={[styles.charCount, { color: colors.onSurfaceVariant }]}>{text.length}/200</Text>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: GUARD_ACCENT }]}
            onPress={() => { onSave(text); onClose(); }}
          >
            <Text style={styles.saveBtnText}>Save Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function GuardDashboardScreen() {
  const { colors } = useTheme();
  const user = useSelector(selectCurrentUser);

  const { data, isLoading, isError, error, refetch, isRefetching } = useGuardDashboard();
  const { data: guardsData, refetch: refetchGuards } = useActiveGuards();
  const { data: messagesData, refetch: refetchMessages } = useGuardMessages();
  const updateStatusMutation = useUpdateGuardStatus();
  const markReadMutation = useMarkMessageRead();

  const [statusMsgModal, setStatusMsgModal] = useState(false);

  const onRefresh = useCallback(() => {
    refetch();
    refetchGuards();
    refetchMessages();
  }, [refetch, refetchGuards, refetchMessages]);

  const stats = data?.data ?? {};
  const visitorsWaiting = stats.visitorsWaiting ?? 0;
  const todayEntries    = stats.todayEntries    ?? 0;
  const currentlyInside = stats.currentlyInside ?? 0;
  const recentEntries   = stats.recentEntries   ?? [];

  // Find this guard's status from guard list
  const guards = guardsData?.data ?? [];
  const myStatus = guards.find((g) => g._id === user?._id || g._id?.toString() === user?._id?.toString());
  const isOnDuty = myStatus?.isOnDuty ?? false;
  const statusMessage = myStatus?.statusMessage ?? '';

  const messages = messagesData?.data?.messages ?? [];
  const unreadCount = messagesData?.data?.unreadCount ?? 0;

  const handleToggleDuty = async (val) => {
    try {
      await updateStatusMutation.mutateAsync({ isOnDuty: val });
    } catch {
      Alert.alert('Error', 'Could not update duty status.');
    }
  };

  const handleSaveStatusMsg = async (msg) => {
    try {
      await updateStatusMutation.mutateAsync({ statusMessage: msg });
    } catch {
      Alert.alert('Error', 'Could not update status message.');
    }
  };

  const handleMarkRead = async (msgId) => {
    await markReadMutation.mutateAsync(msgId);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isError) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState
          error={error?.response?.data?.message ?? 'Failed to load dashboard'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: '#F8F9FB' }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            colors={[GUARD_ACCENT]}
            tintColor={GUARD_ACCENT}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetingSmall, { color: '#757575' }]}>{greeting()},</Text>
            <Text style={styles.guardName}>{user?.firstName ?? 'Guard'}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: GUARD_ACCENT + '1A' }]}>
            <Text style={{ color: GUARD_ACCENT, fontWeight: '800', fontSize: 12 }}>GUARD</Text>
          </View>
        </View>

        {/* ── Duty Toggle Card ── */}
        <Surface style={[styles.dutyCard, { borderColor: isOnDuty ? '#4CAF50' : '#E0E0E0', borderWidth: 2 }]} elevation={3}>
          <View style={styles.dutyCardLeft}>
            <View style={[styles.dutyIconWrap, { backgroundColor: isOnDuty ? '#E8F5E9' : '#F5F5F5' }]}>
              <Ionicons
                name={isOnDuty ? 'shield-checkmark' : 'shield-outline'}
                size={26}
                color={isOnDuty ? '#2E7D32' : '#9E9E9E'}
              />
            </View>
            <View>
              <Text style={styles.dutyLabel}>Duty Status</Text>
              <Text style={[styles.dutyStatus, { color: isOnDuty ? '#2E7D32' : '#9E9E9E' }]}>
                {isOnDuty ? '● On Duty' : '○ Off Duty'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnDuty}
            onValueChange={handleToggleDuty}
            trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
            thumbColor={isOnDuty ? '#2E7D32' : '#BDBDBD'}
            disabled={updateStatusMutation.isPending}
          />
        </Surface>

        {/* ── Status Message Row ── */}
        <TouchableOpacity
          style={[styles.statusMsgRow, { backgroundColor: '#fff' }]}
          onPress={() => setStatusMsgModal(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="chatbox-ellipses-outline" size={20} color={GUARD_ACCENT} />
          <Text style={styles.statusMsgText} numberOfLines={1}>
            {statusMessage || 'Set a status message for residents…'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#9E9E9E" />
        </TouchableOpacity>

     
        {/* ── Messages from Residents ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Messages from Residents</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        {messages.length === 0 ? (
          <Surface style={[styles.emptyMessages, { backgroundColor: '#fff' }]} elevation={1}>
            <Ionicons name="chatbubbles-outline" size={30} color="#BDBDBD" />
            <Text style={{ color: '#9E9E9E', fontSize: 13, marginTop: 6 }}>No messages yet</Text>
          </Surface>
        ) : (
          <View style={styles.list}>
            {messages.map((m) => (
              <MessageCard key={m._id} msg={m} onMarkRead={handleMarkRead} />
            ))}
          </View>
        )}

        {/* ── Recent Entries ── */}
        <Text style={styles.sectionTitle}>Recent Entries</Text>
        {isLoading ? (
          <SkeletonList count={4} />
        ) : recentEntries.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No entries yet"
            subtitle="Visitor entries logged today will appear here."
          />
        ) : (
          <View style={styles.list}>
            {recentEntries.map((v) => (
              <VisitorLogCard key={v._id} visitor={v} />
            ))}
          </View>
        )}
      </ScrollView>

      <StatusMessageModal
        visible={statusMsgModal}
        current={statusMessage}
        onClose={() => setStatusMsgModal(false)}
        onSave={handleSaveStatusMsg}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greetingSmall: { fontSize: 14, marginBottom: 2 },
  guardName: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', letterSpacing: -0.3 },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },

  // Duty toggle card
  dutyCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  dutyCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dutyIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dutyLabel: { fontSize: 13, color: '#757575', fontWeight: '600', marginBottom: 2 },
  dutyStatus: { fontSize: 16, fontWeight: '800' },

  // Status message row
  statusMsgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statusMsgText: { flex: 1, fontSize: 14, color: '#555' },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A2E',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  unreadBadge: {
    backgroundColor: GUARD_ACCENT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  statsGrid: { paddingHorizontal: 16, gap: 12 },
  list: { paddingHorizontal: 16, gap: 10 },

  // Messages
  msgCard: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
    gap: 8,
  },
  msgCardUnread: { backgroundColor: '#FFF8F5', borderLeftWidth: 3, borderLeftColor: GUARD_ACCENT },
  msgCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  msgAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgFrom: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  msgTime: { fontSize: 11, color: '#9E9E9E', marginTop: 1 },
  readBtn: {
    backgroundColor: '#4CAF50',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgBody: { fontSize: 14, color: '#424242', lineHeight: 20 },

  emptyMessages: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  msgInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: -6 },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});