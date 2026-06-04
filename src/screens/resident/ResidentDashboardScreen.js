// src/screens/resident/ResidentDashboardScreen.js
import React, { useCallback, useState } from 'react';
import {
  View, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, TextInput, Modal, Alert, Linking,
} from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { useResidentDashboard } from '../../hooks/useDashboard';
import { useActiveGuards, useSendGuardMessage } from '../../hooks/useGuards';
import StatCard from '../../components/resident/StatCard';
import NoticeCard from '../../components/resident/NoticeCard';
import VisitorCard from '../../components/resident/VisitorCard';
import { SkeletonDashboard, SkeletonList } from '../../components/resident/SkeletonCard';
import { EmptyState, ErrorState } from '../../components/common';

// ── Greeting ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', icon: '🌤️' };
  if (h < 17) return { text: 'Good Afternoon', icon: '☀️' };
  return { text: 'Good Evening', icon: '🌙' };
}

// ── Quick Action Button ───────────────────────────────────────────────────────
function QuickAction({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.quickActionLabel, { color: '#555' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Guard Card ────────────────────────────────────────────────────────────────
function GuardCard({ guard, onMessage, onCall }) {
  const isOnDuty = guard.isOnDuty;
  return (
    <Surface style={[styles.guardCard, { borderLeftColor: isOnDuty ? '#2E7D32' : '#9E9E9E', borderLeftWidth: 4 }]} elevation={2}>
      <View style={styles.guardCardHeader}>
        <View style={[styles.guardAvatar, { backgroundColor: isOnDuty ? '#E8F5E9' : '#F5F5F5' }]}>
          <Ionicons name="shield-checkmark" size={22} color={isOnDuty ? '#2E7D32' : '#9E9E9E'} />
        </View>
        <View style={styles.guardInfo}>
          <Text style={styles.guardName}>{guard.name}</Text>
          <View style={styles.guardStatusRow}>
            <View style={[styles.statusDot, { backgroundColor: isOnDuty ? '#4CAF50' : '#BDBDBD' }]} />
            <Text style={[styles.guardStatusText, { color: isOnDuty ? '#2E7D32' : '#757575' }]}>
              {isOnDuty ? 'On Duty' : 'Off Duty'}
            </Text>
          </View>
          {!!guard.statusMessage && (
            <Text style={styles.guardMessage} numberOfLines={2}>
              "{guard.statusMessage}"
            </Text>
          )}
        </View>
        <View style={styles.guardActions}>
          {isOnDuty && (
            <TouchableOpacity
              style={[styles.guardActionBtn, { backgroundColor: '#E3F2FD' }]}
              onPress={() => onCall(guard.mobile)}
            >
              <Ionicons name="call" size={16} color="#1565C0" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.guardActionBtn, { backgroundColor: '#FFF3E0', marginTop: isOnDuty ? 6 : 0 }]}
            onPress={() => onMessage(guard)}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#E65100" />
          </TouchableOpacity>
        </View>
      </View>
    </Surface>
  );
}

// ── Message Modal ─────────────────────────────────────────────────────────────
function MessageModal({ visible, guard, onClose, onSend }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { colors } = useTheme();

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    await onSend(guard._id, text.trim());
    setSending(false);
    setText('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Message Guard</Text>
              <Text style={[styles.modalSubtitle, { color: colors.onSurfaceVariant }]}>
                To: {guard?.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.msgInput, { borderColor: colors.outlineVariant, color: colors.onSurface, backgroundColor: colors.background }]}
            placeholder="Type your message..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            numberOfLines={4}
          />
          <Text style={[styles.charCount, { color: colors.onSurfaceVariant }]}>{text.length}/500</Text>
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: sending || !text.trim() ? '#BDBDBD' : '#E65100' }]}
            onPress={handleSend}
            disabled={sending || !text.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={styles.sendBtnText}>{sending ? 'Sending...' : 'Send Message'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ResidentDashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const user = useSelector(selectCurrentUser);
  const greeting = getGreeting();

  const { data, isLoading, isError, error, refetch, isRefetching } = useResidentDashboard();
  const { data: guardsData, isLoading: guardsLoading, refetch: refetchGuards } = useActiveGuards();
  const sendMessageMutation = useSendGuardMessage();

  const [selectedGuard, setSelectedGuard] = useState(null);
  const [msgModalVisible, setMsgModalVisible] = useState(false);

  const onRefresh = useCallback(() => {
    refetch();
    refetchGuards();
  }, [refetch, refetchGuards]);

  const stats = data?.data?.stats ?? {};
  const recentVisitors = data?.data?.recentVisitors ?? [];
  const recentNotices = data?.data?.recentNotices ?? [];
  const guards = guardsData?.data ?? [];

  const handleMessage = (guard) => {
    setSelectedGuard(guard);
    setMsgModalVisible(true);
  };

  const handleCall = (mobile) => {
    Linking.openURL(`tel:${mobile}`).catch(() =>
      Alert.alert('Error', 'Unable to open phone dialer.')
    );
  };

  const handleSend = async (guardId, message) => {
    try {
      await sendMessageMutation.mutateAsync({ guardId, message });
      Alert.alert('Sent!', 'Your message has been delivered to the guard.');
    } catch {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  if (isError) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState
          error={error?.response?.data?.message ?? 'Failed to load dashboard'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const onDutyGuards = guards.filter((g) => g.isOnDuty);
  const offDutyGuards = guards.filter((g) => !g.isOnDuty);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: '#F8F9FB' }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Header ── */}
        <View style={styles.heroHeader}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greetingSmall}>{greeting.icon} {greeting.text}</Text>
              <Text style={styles.greetingName}>
                {user?.firstName ?? 'Resident'} {user?.lastName ?? ''}
              </Text>
              {user?.flatNumber && (
                <View style={styles.flatBadge}>
                  <Ionicons name="home-outline" size={12} color={colors.primary} />
                  <Text style={[styles.flatBadgeText, { color: colors.primary }]}>
                    Flat {user.flatNumber}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {(user?.firstName?.[0] ?? 'R').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Guard duty summary pill */}
          {!guardsLoading && (
            <View style={[styles.dutyPill, { backgroundColor: onDutyGuards.length > 0 ? '#E8F5E9' : '#FFF3E0' }]}>
              <View style={[styles.statusDot, { backgroundColor: onDutyGuards.length > 0 ? '#4CAF50' : '#FF9800', width: 8, height: 8 }]} />
              <Text style={[styles.dutyPillText, { color: onDutyGuards.length > 0 ? '#2E7D32' : '#E65100' }]}>
                {onDutyGuards.length > 0
                  ? `${onDutyGuards.length} Guard${onDutyGuards.length > 1 ? 's' : ''} On Duty`
                  : 'No Guards On Duty'}
              </Text>
            </View>
          )}
        </View>

    

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
    
<Surface style={styles.quickActionsRow} elevation={1}>
  <QuickAction icon="people-outline"        label="Visitors"    color={colors.primary}  onPress={() => navigation?.navigate?.('ResidentVisitors')} />
  <QuickAction icon="shield-checkmark-outline" label="Whitelist" color="#2E7D32"       onPress={() => navigation?.navigate?.('ResidentPreApproved')} />
  <QuickAction icon="calendar-outline"      label="Amenities"   color="#9C27B0"         onPress={() => navigation?.navigate?.('ResidentAmenities')} />
  <QuickAction icon="warning-outline"       label="SOS"         color="#C62828"         onPress={() => navigation?.navigate?.('ResidentSos')} />
</Surface>

        {/* ── Guard Status Section ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Security & Guards</Text>
          {onDutyGuards.length > 0 && (
            <View style={styles.onDutyBadge}>
              <Text style={styles.onDutyBadgeText}>{onDutyGuards.length} Active</Text>
            </View>
          )}
        </View>

        {guardsLoading ? (
          <SkeletonList count={2} />
        ) : guards.length === 0 ? (
          <Surface style={[styles.emptyGuards, { backgroundColor: colors.surface }]} elevation={1}>
            <Ionicons name="shield-outline" size={32} color={colors.onSurfaceVariant} />
            <Text style={[styles.emptyGuardsText, { color: colors.onSurfaceVariant }]}>
              No guards registered in your society
            </Text>
          </Surface>
        ) : (
          <View style={styles.guardsList}>
            {/* On Duty First */}
            {onDutyGuards.length > 0 && (
              <>
                <Text style={styles.guardGroupLabel}>🟢 On Duty</Text>
                {onDutyGuards.map((g) => (
                  <GuardCard key={g._id} guard={g} onMessage={handleMessage} onCall={handleCall} />
                ))}
              </>
            )}
            {/* Off Duty */}
            {offDutyGuards.length > 0 && (
              <>
                <Text style={[styles.guardGroupLabel, { color: '#9E9E9E' }]}>⚫ Off Duty</Text>
                {offDutyGuards.map((g) => (
                  <GuardCard key={g._id} guard={g} onMessage={handleMessage} onCall={handleCall} />
                ))}
              </>
            )}
          </View>
        )}

        {/* ── Recent Visitors ── */}
        <Text style={styles.sectionTitle}>Recent Visitors</Text>
        {isLoading ? (
          <SkeletonList count={3} />
        ) : recentVisitors.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No recent visitors"
            subtitle="Visitors logged by the guard will appear here."
          />
        ) : (
          <View style={styles.list}>
            {recentVisitors.map((v) => (
              <VisitorCard key={v._id} visitor={v} />
            ))}
          </View>
        )}

        {/* ── Recent Notices ── */}
        <Text style={styles.sectionTitle}>Recent Notices</Text>
        {isLoading ? (
          <SkeletonList count={2} />
        ) : recentNotices.length === 0 ? (
          <EmptyState
            icon="newspaper-outline"
            title="No notices yet"
            subtitle="Society notices will appear here."
          />
        ) : (
          <View style={styles.list}>
            {recentNotices.map((n) => (
              <NoticeCard key={n._id} notice={n} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Message Modal */}
      {selectedGuard && (
        <MessageModal
          visible={msgModalVisible}
          guard={selectedGuard}
          onClose={() => { setMsgModalVisible(false); setSelectedGuard(null); }}
          onSend={handleSend}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 40 },

  // Hero Header
  heroHeader: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  greetingSmall: { fontSize: 14, color: '#757575', marginBottom: 4 },
  greetingName: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', letterSpacing: -0.3 },
  flatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  flatBadgeText: { fontSize: 12, fontWeight: '600' },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: '#fff', fontSize: 22, fontWeight: '800' },
  dutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dutyPillText: { fontSize: 13, fontWeight: '700' },

  // Section
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A2E',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  onDutyBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onDutyBadgeText: { color: '#2E7D32', fontSize: 12, fontWeight: '700' },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    justifyContent: 'space-around',
  },
  quickAction: { alignItems: 'center', gap: 6, flex: 1 },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Guards
  guardsList: { paddingHorizontal: 16, gap: 10 },
  guardGroupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
    marginTop: 4,
    marginLeft: 2,
  },
  guardCard: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
    marginBottom: 2,
  },
  guardCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  guardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardInfo: { flex: 1 },
  guardName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 3 },
  guardStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  guardStatusText: { fontSize: 12, fontWeight: '600' },
  guardMessage: {
    fontSize: 12,
    color: '#757575',
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 17,
  },
  guardActions: { alignItems: 'center', gap: 0 },
  guardActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGuards: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },
  emptyGuardsText: { fontSize: 13, textAlign: 'center' },

  // Message Modal
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
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  modalSubtitle: { fontSize: 13, marginTop: 2 },
  msgInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: -8 },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  list: { paddingHorizontal: 16, gap: 10 },
});