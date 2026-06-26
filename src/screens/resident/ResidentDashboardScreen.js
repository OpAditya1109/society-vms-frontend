// src/screens/resident/ResidentDashboardScreen.js
import React, { useCallback, useState } from 'react';
import {
  View, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, TextInput, Modal, Alert, Linking,
  Animated, Dimensions, Image,
} from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { useResidentDashboard } from '../../hooks/useDashboard';
import { useActiveGuards, useSendGuardMessage } from '../../hooks/useGuards';
import { SCREENS } from '../../constants';
import StatCard from '../../components/resident/StatCard';
import NoticeCard from '../../components/resident/NoticeCard';
import { SkeletonDashboard, SkeletonList } from '../../components/resident/SkeletonCard';
import { EmptyState, ErrorState } from '../../components/common';

// ── All actions definition ────────────────────────────────────────────────────
const ALL_ACTIONS = [
  { icon: 'people-outline',           label: 'Visitors',   color: '#4361EE', screen: 'ResidentVisitors' },
  { icon: 'shield-checkmark-outline', label: 'Whitelist',  color: '#2E7D32', screen: 'ResidentPreApproved' },
  { icon: 'calendar-outline',         label: 'Amenities',  color: '#9C27B0', screen: 'ResidentAmenities' },
  { icon: 'warning-outline',          label: 'SOS',        color: '#C62828', screen: 'ResidentSos' },
  { icon: 'alert-circle-outline',     label: 'Complaints', color: '#F57C00', screen: 'ResidentComplaints' },
  { icon: 'newspaper-outline',        label: 'Notices',    color: '#0277BD', screen: 'ResidentNotices' },
  { icon: 'storefront-outline',       label: 'Market',     color: '#6D4C41', screen: 'ResidentMarketplace' },
  { icon: 'people-circle-outline',    label: 'Family',     color: '#00897B', screen: 'ResidentFamilyMembers' },
  { icon: 'car-outline',              label: 'Vehicles',   color: '#5C6BC0', screen: 'ResidentVehicles' },
  { icon: 'help-buoy-outline',        label: 'Daily Help', color: '#D81B60', screen: 'ResidentDailyHelp' },
  { icon: 'globe-outline',            label: 'Community',  color: '#558B2F', screen: 'ResidentCommunity' },
];
const VISIBLE_COUNT = 7;
const HIDDEN_COUNT  = ALL_ACTIONS.length - VISIBLE_COUNT;

// ── Quick Action Button ───────────────────────────────────────────────────────
function QuickAction({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── View More tile ────────────────────────────────────────────────────────────
function ViewMoreTile({ onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.quickActionIcon, { backgroundColor: '#546E7A18', position: 'relative' }]}>
        <Ionicons name="grid-outline" size={22} color="#546E7A" />
        <View style={styles.moreBadge}>
          <Text style={styles.moreBadgeText}>+{HIDDEN_COUNT}</Text>
        </View>
      </View>
      <Text style={[styles.quickActionLabel, { color: '#546E7A' }]}>View More</Text>
    </TouchableOpacity>
  );
}

// ── All Actions Bottom Sheet ──────────────────────────────────────────────────
const SHEET_HEIGHT = Dimensions.get('window').height * 0.55;

function AllActionsSheet({ visible, onClose, onNavigate }) {
  const slideAnim = React.useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim  = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 18, tension: 120, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" onRequestClose={onClose} visible={visible}>
      <Animated.View style={[styles.sheetOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>All Features</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={26} color="#9E9E9E" />
            </TouchableOpacity>
          </View>
          <View style={styles.sheetGrid}>
            {ALL_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.sheetAction}
                activeOpacity={0.75}
                onPress={() => { onClose(); onNavigate(action.screen); }}
              >
                <View style={[styles.sheetActionIcon, { backgroundColor: action.color + '18' }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.sheetActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
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
  const { data, isLoading, isError, error, refetch, isRefetching } = useResidentDashboard();
  const { data: guardsData, isLoading: guardsLoading, refetch: refetchGuards } = useActiveGuards();
  const sendMessageMutation = useSendGuardMessage();

  const [selectedGuard, setSelectedGuard] = useState(null);
  const [msgModalVisible, setMsgModalVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const onRefresh = useCallback(() => {
    refetch();
    refetchGuards();
  }, [refetch, refetchGuards]);

  if (user?.isActive === false) {
    return (
      <PendingApprovalScreen
        onRefresh={onRefresh}
        isRefreshing={isRefetching}
      />
    );
  }

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
    const status = error?.response?.status;
    const msg = (error?.response?.data?.message ?? '').toLowerCase();
    const isPending =
      status === 403 ||
      msg.includes('pending') ||
      msg.includes('not approved') ||
      msg.includes('not active') ||
      user?.isActive === false;

    if (isPending) {
      return (
        <PendingApprovalScreen
          onRefresh={refetch}
          isRefreshing={isRefetching}
        />
      );
    }

    return (
      <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
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
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroGreeting}>Welcome back 👋</Text>
              <Text style={styles.heroName} numberOfLines={1}>
                {user?.firstName ?? 'Resident'} {user?.lastName ?? ''}
              </Text>
            </View>

            {/* Avatar — tap to open Profile */}
            <TouchableOpacity
              style={styles.heroAvatar}
              onPress={() => navigation?.navigate?.('ResidentProfileStack')}
              activeOpacity={0.8}
            >
              <Text style={styles.heroAvatarLetter}>
                {(user?.firstName?.[0] ?? 'R').toUpperCase()}
              </Text>
              {/* Small profile indicator dot */}
              <View style={styles.profileDot} />
            </TouchableOpacity>
          </View>

          {user?.flatNumber && (
            <View style={styles.heroFlatBadge}>
              <Ionicons name="home-outline" size={13} color="#4361EE" />
              <Text style={styles.heroFlatText}>Flat {user.flatNumber}</Text>
            </View>
          )}
        </View>

        {/* ── Quick Actions ── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Surface style={styles.quickActionsCard} elevation={1}>
          <View style={styles.quickActionsGrid}>
            {ALL_ACTIONS.slice(0, VISIBLE_COUNT).map((action) => (
              <QuickAction
                key={action.label}
                icon={action.icon}
                label={action.label}
                color={action.color}
                onPress={() => navigation?.navigate?.(action.screen)}
              />
            ))}
            <ViewMoreTile onPress={() => setSheetVisible(true)} />
          </View>
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
            {onDutyGuards.length > 0 && (
              <>
                <Text style={styles.guardGroupLabel}>🟢 On Duty</Text>
                {onDutyGuards.map((g) => (
                  <GuardCard key={g._id} guard={g} onMessage={handleMessage} onCall={handleCall} />
                ))}
              </>
            )}
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
          <SkeletonList count={1} />
        ) : recentVisitors.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No recent visitors"
            subtitle="Visitors logged by the guard will appear here."
          />
        ) : (
          <Surface style={styles.recentVisitorsCard} elevation={1}>
            <View style={styles.recentVisitorsGrid}>
           {recentVisitors.slice(0, 3).map((v) => (
  <View key={v._id} style={styles.recentVisitorTile}>
    {v.photoUrl ? (
      <Image source={{ uri: v.photoUrl }} style={styles.recentVisitorPhoto} />
    ) : (
      <View style={[styles.recentVisitorIcon, { backgroundColor: colors.primaryContainer }]}>
        <Ionicons name="account-outline" size={22} color={colors.primary} />
      </View>
    )}
    <Text style={styles.recentVisitorName} numberOfLines={1}>
      {v.name}
    </Text>
  </View>
))}
              <TouchableOpacity
                style={styles.recentVisitorTile}
                activeOpacity={0.75}
                onPress={() => navigation?.navigate?.(SCREENS.RESIDENT_VISITORS)}
              >
                <View style={[styles.recentVisitorIcon, { backgroundColor: '#546E7A18' }]}>
                  <Ionicons name="arrow-forward-outline" size={22} color="#546E7A" />
                </View>
                <Text style={[styles.recentVisitorName, { color: '#546E7A' }]}>View More</Text>
              </TouchableOpacity>
            </View>
          </Surface>
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

      {/* All Actions Sheet */}
      <AllActionsSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onNavigate={(screen) => navigation?.navigate?.(screen)}
      />

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
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 18,
    elevation: 3,
    shadowColor: '#4361EE',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: '#F0F1FF',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroGreeting: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '500',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.3,
  },
  heroAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#4361EE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroAvatarLetter: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
  },
  // Small dot in corner to hint it's tappable / profile
  profileDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  heroFlatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#EEF1FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  heroFlatText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4361EE',
  },

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

  // Quick Actions
  quickActionsCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickAction: { alignItems: 'center', gap: 6, width: '25%', paddingVertical: 10, paddingHorizontal: 4 },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 10.5, fontWeight: '600', textAlign: 'center', color: '#555' },
  moreBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#546E7A',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 22,
    alignItems: 'center',
  },
  moreBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // All Actions Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 36,
    paddingHorizontal: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
  sheetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sheetAction: { alignItems: 'center', gap: 7, width: '25%', paddingVertical: 12, paddingHorizontal: 4 },
  sheetActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActionLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center', color: '#444' },

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

 // Recent Visitors — single card, Quick-Actions style grid (3 + View More)
  recentVisitorsCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
  },
  recentVisitorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recentVisitorTile: {
    alignItems: 'center',
    gap: 6,
    width: '25%',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  recentVisitorIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentVisitorName: {
    fontSize: 10.5,
    fontWeight: '600',
    textAlign: 'center',
    color: '#555',
  },
  recentVisitorPhoto: {
  width: 52,
  height: 52,
  borderRadius: 16,
},
});