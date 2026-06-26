// src/screens/admin/AdminDashboardScreen.js
import React, { useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, useTheme, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { SkeletonDashboard } from '../../components/resident/SkeletonCard';
import { ErrorState } from '../../components/common';

const ADMIN_ACCENT = '#4A148C';

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

function GlanceRow({ icon, color, label, value }) {
  return (
    <View style={styles.glanceRow}>
      <View style={[styles.glanceIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.glanceLabel}>{label}</Text>
      <Text style={[styles.glanceValue, { color }]}>{value}</Text>
    </View>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const user = useSelector(selectCurrentUser);
  const { data, isLoading, isError, error, refetch, isRefetching } = useAdminDashboard();

  const onRefresh = useCallback(() => refetch(), [refetch]);

  const stats = data?.data?.stats ?? data?.data ?? {};
  const totalResidents = stats.totalResidents ?? stats.totalMembers     ?? 0;
  const visitorsToday  = stats.visitorsToday  ?? stats.todayVisitors    ?? 0;
  const openComplaints = stats.openComplaints ?? stats.pendingComplaints ?? 0;
  const totalNotices   = stats.totalNotices   ?? stats.noticesCount     ?? 0;
  const { text, icon } = getGreeting();

  if (isError) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.screen}>
        <ErrorState error={error?.response?.data?.message ?? 'Failed to load dashboard'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.screen}>
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

     

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Surface style={styles.quickActionsCard} elevation={1}>
          <View style={styles.quickActionsRow}>
            <QuickAction icon="people-outline"      label="Residents"  color={ADMIN_ACCENT} onPress={() => navigation?.navigate?.('AdminMembers')} />
            <QuickAction icon="newspaper-outline"   label="Notices"    color="#2E7D32"      onPress={() => navigation?.navigate?.('AdminNotices')} />
            <QuickAction icon="alert-circle-outline" label="Complaints" color="#C62828"     badge={openComplaints} onPress={() => navigation?.navigate?.('AdminComplaints')} />
            <QuickAction icon="business-outline"    label="Amenities"  color="#1565C0"      onPress={() => navigation?.navigate?.('AdminAmenitiesTab')} />
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

  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: '#1A1A2E',
    paddingHorizontal: 20, marginTop: 22, marginBottom: 12,
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 },
  statCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 18,
    padding: 16, alignItems: 'flex-start', gap: 4,
  },
  statIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: '900', color: '#1A1A2E', lineHeight: 32 },
  statTitle: { fontSize: 12, fontWeight: '600', color: '#757575' },

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

  glanceCard: { backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16, padding: 4 },
  glanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  glanceIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  glanceLabel: { flex: 1, fontSize: 13, color: '#555', fontWeight: '500' },
  glanceValue: { fontSize: 18, fontWeight: '800' },
  glanceDivider: { height: 1, backgroundColor: '#F5F5F5', marginHorizontal: 14 },
});