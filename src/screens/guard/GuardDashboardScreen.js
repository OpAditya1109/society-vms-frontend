// src/screens/guard/GuardDashboardScreen.js
import React, { useCallback, useState } from 'react';
import {
  View, ScrollView, StyleSheet, RefreshControl,
  Switch, TouchableOpacity, TextInput, Modal, Alert,
  StatusBar, Platform,
} from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { SCREENS } from '../../constants';
import { useGuardDashboard } from '../../hooks/useGuardDashboard';
import {
  useActiveGuards,
  useUpdateGuardStatus,
  useGuardMessages,
  useMarkMessageRead,
} from '../../hooks/useGuards';
import VisitorLogCard from '../../components/guard/VisitorLogCard';
import { SkeletonList } from '../../components/resident/SkeletonCard';
import { EmptyState, ErrorState } from '../../components/common';

const GUARD_ACCENT = '#E65100';

// ── Message Card ──────────────────────────────────────────────────────────────
function MessageCard({ msg, onMarkRead }) {
  const { colors } = useTheme();
  return (
    <Surface
      style={[styles.msgCard, { backgroundColor: colors.surface }, !msg.isRead && styles.msgCardUnread]}
      elevation={2}
    >
      <View style={styles.msgCardHeader}>
        <View style={styles.msgAvatarWrap}>
          <Ionicons name="person-outline" size={18} color={GUARD_ACCENT} />
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
          <TouchableOpacity style={styles.readBtn} onPress={() => onMarkRead(msg._id)}>
            <Ionicons name="checkmark-done" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.msgBody, { color: colors.onSurface }]}>{msg.message}</Text>
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
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Set Status Message</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, marginBottom: 8 }}>
            Residents will see this message on their home screen.
          </Text>
          <TextInput
            style={[styles.msgInput, {
              borderColor: colors.outlineVariant,
              color: colors.onSurface,
              backgroundColor: colors.background,
            }]}
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
  const navigation = useNavigation();
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
  const recentEntries   = stats.recentEntries   ?? [];

  const guards = guardsData?.data ?? [];
  const myStatus = guards.find(
    (g) => g._id === user?._id || g._id?.toString() === user?._id?.toString()
  );
  const isOnDuty     = myStatus?.isOnDuty     ?? false;
  const statusMessage = myStatus?.statusMessage ?? '';

  const messages    = messagesData?.data?.messages   ?? [];
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
      <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState
          error={error?.response?.data?.message ?? 'Failed to load dashboard'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    // edges={['top','bottom']} — handles status bar on Android AND notch/home bar on iOS
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: '#F8F9FB' }]}>
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
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.greetingSmall}>{greeting()},</Text>
            <Text style={styles.guardName} numberOfLines={1}>
              {user?.firstName ?? 'Guard'}
            </Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: GUARD_ACCENT + '1A' }]}>
            <Ionicons name="shield-outline" size={12} color={GUARD_ACCENT} />
            <Text style={[styles.roleBadgeText, { color: GUARD_ACCENT }]}>GUARD</Text>
          </View>
        </View>

        {/* ── Duty Toggle Card ── */}
        <Surface
          style={[
            styles.dutyCard,
            { borderColor: isOnDuty ? '#4CAF50' : '#E0E0E0', borderWidth: 2 },
          ]}
          elevation={3}
        >
          <View style={styles.dutyCardLeft}>
            <View style={[styles.dutyIconWrap, { backgroundColor: isOnDuty ? '#E8F5E9' : '#F5F5F5' }]}>
              <Ionicons
                name={isOnDuty ? 'shield-checkmark' : 'shield-outline'}
                size={24}
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
          <Ionicons name="chatbox-ellipses-outline" size={18} color={GUARD_ACCENT} />
          <Text style={styles.statusMsgText} numberOfLines={1}>
            {statusMessage || 'Set a status message for residents…'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#9E9E9E" />
        </TouchableOpacity>

        {/* ── Messages from Residents ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Messages</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        {messages.length === 0 ? (
          <Surface style={[styles.emptyMessages, { backgroundColor: '#fff' }]} elevation={1}>
            <Ionicons name="chatbubbles-outline" size={28} color="#BDBDBD" />
            <Text style={{ color: '#9E9E9E', fontSize: 13, marginTop: 6 }}>No messages yet</Text>
          </Surface>
        ) : (
          <View style={styles.list}>
            {messages.slice(0, 3).map((m) => (
              <View key={m._id} style={styles.cardGap}>
                <MessageCard msg={m} onMarkRead={handleMarkRead} />
              </View>
            ))}
          </View>
        )}

        {/* ── Recent Entries ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Entries</Text>
          {recentEntries.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('GuardVisitorStack')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.viewMoreLink}>View All</Text>
            </TouchableOpacity>
          )}
        </View>
        {isLoading ? (
          <SkeletonList count={3} />
        ) : recentEntries.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No entries yet"
            subtitle="Visitor entries logged today will appear here."
          />
        ) : (
          <View style={styles.list}>
            {recentEntries.slice(0, 3).map((v) => (
              <View key={v._id} style={styles.cardGap}>
                <VisitorLogCard visitor={v} />
              </View>
            ))}
            {recentEntries.length > 3 && (
              <TouchableOpacity
                style={styles.viewMoreBtn}
                onPress={() => navigation.navigate('GuardVisitorStack')}
                activeOpacity={0.75}
              >
                <Text style={styles.viewMoreBtnText}>View More</Text>
                <Ionicons name="chevron-forward" size={15} color={GUARD_ACCENT} />
              </TouchableOpacity>
            )}
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
  scroll: { paddingBottom: 32 },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  greetingSmall: { fontSize: 13, color: '#757575', marginBottom: 1 },
  guardName: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', letterSpacing: -0.3 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleBadgeText: { fontWeight: '800', fontSize: 11, marginLeft: 4 },

  // ── Stat cards row (3 equal columns, no gap property) ─────────────────────

  // ── Duty card ─────────────────────────────────────────────────────────────
  dutyCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  dutyCardLeft: { flexDirection: 'row', alignItems: 'center' },
  dutyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dutyLabel: { fontSize: 12, color: '#757575', fontWeight: '600', marginBottom: 2 },
  dutyStatus: { fontSize: 15, fontWeight: '800' },

  // ── Status message row ────────────────────────────────────────────────────
  statusMsgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  statusMsgText: { flex: 1, fontSize: 13, color: '#555', marginHorizontal: 8 },

  // ── Section headers ───────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A2E',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  unreadBadge: {
    backgroundColor: GUARD_ACCENT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // ── Lists ─────────────────────────────────────────────────────────────────
  list: { paddingHorizontal: 16 },
  cardGap: { marginBottom: 10 },

  // ── Message cards ─────────────────────────────────────────────────────────
  msgCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  msgCardUnread: { borderLeftWidth: 3, borderLeftColor: GUARD_ACCENT },
  msgCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  msgAvatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  msgFrom: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  msgTime: { fontSize: 11, color: '#9E9E9E', marginTop: 1 },
  readBtn: {
    backgroundColor: '#4CAF50',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  msgBody: { fontSize: 13, lineHeight: 19 },

  viewMoreLink: {
    fontSize: 13,
    fontWeight: '700',
    color: GUARD_ACCENT,
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: GUARD_ACCENT + '12',
    borderWidth: 1,
    borderColor: GUARD_ACCENT + '30',
  },
  viewMoreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: GUARD_ACCENT,
    marginRight: 4,
  },
  emptyMessages: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  msgInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 4,
  },
  charCount: { fontSize: 11, textAlign: 'right', marginBottom: 12 },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});