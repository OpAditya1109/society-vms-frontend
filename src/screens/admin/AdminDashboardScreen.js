// src/screens/admin/AdminDashboardScreen.js
import React, { useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { useActiveGuards } from '../../hooks/useGuards';
import { SkeletonDashboard } from '../../components/resident/SkeletonCard';
import { ErrorState } from '../../components/common';

const ADMIN_ACCENT = '#4A148C';
const GUARD_ACCENT = '#E65100';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', icon: '🌤️' };
  if (h < 17) return { text: 'Good Afternoon', icon: '☀️' };
  return { text: 'Good Evening', icon: '🌙' };
}

function StatCard({ title, value, icon, color }) {
  return (
    <Surface style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]} elevation={2}>
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Surface>
  );
}

function QuickAction({ icon, label, color, onPress, badge }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.qaIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
        {badge > 0 ? (
          <View style={[styles.qaBadge, { backgroundColor: color }]}>
            <Text style={styles.qaBadgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Single guard row in the dashboard preview */
function GuardRow({ guard, onPress }) {
  const isOnDuty = guard.isOnDuty;
  return (
    <TouchableOpacity style={styles.guardRow} onPress={() => onPress?.(guard)} activeOpacity={0.75}>
      {/* Avatar */}
      <View style={[styles.guardAvatar, { backgroundColor: GUARD_ACCENT + '18' }]}>
        <Text style={[styles.guardAvatarText, { color: GUARD_ACCENT }]}>
          {(guard.name?.[0] ?? '?').toUpperCase()}
        </Text>
      </View>

      {/* Name + last update */}
      <View style={{ flex: 1 }}>
        <Text style={styles.guardName}>{guard.name}</Text>
        {guard.statusMessage ? (
          <Text style={styles.guardSub} numberOfLines={1}>{guard.statusMessage}</Text>
        ) : null}
      </View>

      {/* Duty badge */}
      <View style={[
        styles.dutyBadge,
        { backgroundColor: isOnDuty ? '#E8F5E9' : '#FAFAFA' }
      ]}>
        <View style={[
          styles.dutyDot,
          { backgroundColor: isOnDuty ? '#4CAF50' : '#BDBDBD' }
        ]} />
        <Text style={[
          styles.dutyText,
          { color: isOnDuty ? '#2E7D32' : '#9E9E9E' }
        ]}>
          {isOnDuty ? 'On Duty' : 'Off Duty'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const user = useSelector(selectCurrentUser);
  const { data, isLoading, isError, error, refetch, isRefetching } = useAdminDashboard();

  // Guards data — non-blocking; dashboard still loads even if this errors
  const { data: guardsData } = useActiveGuards();

  const onRefresh = useCallback(() => refetch(), [refetch]);

  const stats = data?.data?.stats ?? data?.data ?? {};
  const totalResidents = stats.totalResidents ?? stats.totalMembers     ?? 0;
  const visitorsToday  = stats.visitorsToday  ?? stats.todayVisitors    ?? 0;
  const openComplaints = stats.openComplaints ?? stats.pendingComplaints ?? 0;
  const totalNotices   = stats.totalNotices   ?? stats.noticesCount     ?? 0;
  const { text, icon } = getGreeting();

  // Guard summary
  const allGuards  = guardsData?.data ?? guardsData?.guards ?? [];
  const onDutyList = allGuards.filter((g) => g.isOnDuty);
  const previewGuards = allGuards.slice(0, 3); // show top 3 on dashboard

  const handleGuardPress = useCallback((guard) => {
    // Map API shape to what GuardDetailScreen expects
    const mapped = {
      _id:         guard._id,
      firstName:   guard.name?.split(' ')[0] ?? '',
      lastName:    guard.name?.split(' ').slice(1).join(' ') ?? '',
      mobile:      guard.mobile,
      dutyStatus:  guard.isOnDuty ? 'active' : 'inactive',
      statusMessage: guard.statusMessage,
    };
    navigation?.navigate?.('GuardDetail', { guardId: guard._id, guard: mapped });
  }, [navigation]);

  if (isError) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.screen}>
        <ErrorState error={error?.response?.data?.message ?? 'Failed to load dashboard'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[ADMIN_ACCENT]} tintColor={ADMIN_ACCENT} />
        }
      >
        {/* Hero Header */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroGreet}>{icon} {text}</Text>
              <Text style={styles.heroName}>{user?.firstName ?? 'Admin'}</Text>
              <View style={styles.heroBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#fff" />
                <Text style={styles.heroBadgeText}>Society Admin</Text>
              </View>
            </View>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>
                {(user?.firstName?.[0] ?? 'A').toUpperCase()}
              </Text>
            </View>
          </View>
          {user?.societyName ? (
            <View style={styles.societyChip}>
              <Ionicons name="business-outline" size={14} color="#fff" />
              <Text style={styles.societyChipText}>{user.societyName}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Guards At a Glance ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Guards</Text>
          <TouchableOpacity
            onPress={() => navigation?.navigate?.('AdminGuards')}
            style={styles.seeAllBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={14} color={GUARD_ACCENT} />
          </TouchableOpacity>
        </View>

        <Surface style={styles.guardsCard} elevation={1}>
          {/* Summary row: total / on-duty */}
          <View style={styles.guardsSummary}>
            <View style={styles.guardsStat}>
              <Text style={styles.guardsStatValue}>{allGuards.length}</Text>
              <Text style={styles.guardsStatLabel}>Total Guards</Text>
            </View>
            <View style={styles.guardsDivider} />
            <View style={styles.guardsStat}>
              <Text style={[styles.guardsStatValue, { color: '#4CAF50' }]}>{onDutyList.length}</Text>
              <Text style={styles.guardsStatLabel}>On Duty Now</Text>
            </View>
            <View style={styles.guardsDivider} />
            <View style={styles.guardsStat}>
              <Text style={[styles.guardsStatValue, { color: '#9E9E9E' }]}>
                {allGuards.length - onDutyList.length}
              </Text>
              <Text style={styles.guardsStatLabel}>Off Duty</Text>
            </View>
          </View>

          {/* Guard rows preview */}
          {previewGuards.length > 0 ? (
            <>
              <View style={styles.guardsListDivider} />
              {previewGuards.map((guard, idx) => (
                <React.Fragment key={guard._id}>
                  <GuardRow guard={guard} onPress={handleGuardPress} />
                  {idx < previewGuards.length - 1 && (
                    <View style={styles.guardsRowDivider} />
                  )}
                </React.Fragment>
              ))}
              {allGuards.length > 3 && (
                <TouchableOpacity
                  style={styles.viewMoreBtn}
                  onPress={() => navigation?.navigate?.('AdminGuards')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewMoreText}>
                    View all {allGuards.length} guards
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={GUARD_ACCENT} />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.guardsEmpty}>
              <Ionicons name="shield-outline" size={28} color="#CCC" />
              <Text style={styles.guardsEmptyText}>No guards in society yet</Text>
            </View>
          )}
        </Surface>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Surface style={styles.quickActionsCard} elevation={1}>
          <View style={styles.quickActionsRow}>
            <QuickAction icon="people-outline"       label="Residents"  color={ADMIN_ACCENT} onPress={() => navigation?.navigate?.('AdminMembers')} />
            <QuickAction icon="newspaper-outline"    label="Notices"    color="#2E7D32"      onPress={() => navigation?.navigate?.('AdminNotices')} />
            <QuickAction icon="alert-circle-outline" label="Complaints" color="#C62828"      badge={openComplaints} onPress={() => navigation?.navigate?.('AdminComplaints')} />
            <QuickAction icon="business-outline"     label="Amenities"  color="#1565C0"      onPress={() => navigation?.navigate?.('AdminAmenitiesTab')} />
          </View>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F3FF' },
  scroll: { paddingBottom: 40 },

  hero: {
    backgroundColor: ADMIN_ACCENT,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroGreet: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  heroName: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 6 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start',
  },
  heroBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  heroAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  heroAvatarText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  societyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 16, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  societyChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Section headings
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: '#1A1A2E',
    paddingHorizontal: 20, marginTop: 22, marginBottom: 12,
  },
  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
  },
  seeAllText: {
    fontSize: 13, fontWeight: '700', color: GUARD_ACCENT,
  },

  // ── Guards card ──
  guardsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  guardsSummary: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  guardsStat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  guardsStatValue: {
    fontSize: 24, fontWeight: '900', color: '#1A1A2E',
  },
  guardsStatLabel: {
    fontSize: 11, fontWeight: '600', color: '#9E9E9E',
  },
  guardsDivider: {
    width: 1, backgroundColor: '#F0F0F0', marginVertical: 4,
  },
  guardsListDivider: {
    height: 1, backgroundColor: '#F5F5F5', marginHorizontal: 16,
  },

  // Guard row
  guardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  guardAvatar: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  guardAvatarText: { fontSize: 15, fontWeight: '800' },
  guardName: { fontSize: 13, fontWeight: '700', color: '#1A1A2E' },
  guardSub: { fontSize: 11, color: '#9E9E9E', marginTop: 1 },
  dutyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  dutyDot: { width: 6, height: 6, borderRadius: 3 },
  dutyText: { fontSize: 11, fontWeight: '700' },

  guardsRowDivider: {
    height: 1, backgroundColor: '#F5F5F5', marginHorizontal: 16,
  },
  viewMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#F5F5F5',
  },
  viewMoreText: {
    fontSize: 13, fontWeight: '700', color: GUARD_ACCENT,
  },
  guardsEmpty: {
    alignItems: 'center', paddingVertical: 20, gap: 8,
  },
  guardsEmptyText: {
    fontSize: 13, color: '#BDBDBD', fontWeight: '600',
  },

  // Quick Actions
  quickActionsCard: { backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16, padding: 12 },
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  quickAction: { alignItems: 'center', gap: 6, flex: 1, paddingVertical: 8 },
  qaIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 11, fontWeight: '700', color: '#555', textAlign: 'center' },
  qaBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  qaBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
});