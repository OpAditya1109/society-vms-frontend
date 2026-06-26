// src/screens/guard/GuardProfileScreen.js
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Appbar, Surface, Avatar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { useGuardStats } from '../../hooks/useGuards';
import { AppButton } from '../../components/common';

const GUARD_ACCENT = '#E65100';

function ProfileRow({ icon, label, value, colors }) {
  if (!value) return null;
  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.iconWrap, { backgroundColor: GUARD_ACCENT + '1A' }]}>
        <Ionicons name={icon} size={18} color={GUARD_ACCENT} />
      </View>
      <View style={rowStyles.text}>
        <Text
          variant="labelSmall"
          style={{ color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.4 }}
        >
          {label}
        </Text>
        <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function StatTile({ icon, label, value, tint, colors }) {
  return (
    <View style={[statStyles.tile, { backgroundColor: tint + '14' }]}>
      <View style={[statStyles.tileIconWrap, { backgroundColor: tint + '22' }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={[statStyles.tileValue, { color: colors.onSurface }]}>{value}</Text>
      <Text style={[statStyles.tileLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
    </View>
  );
}

function RateBar({ label, rate, tint, colors, sublabel }) {
  const pct = Math.max(0, Math.min(100, rate ?? 0));
  return (
    <View style={statStyles.rateRow}>
      <View style={statStyles.rateHeader}>
        <Text style={[statStyles.rateLabel, { color: colors.onSurface }]}>{label}</Text>
        <Text style={[statStyles.ratePct, { color: tint }]}>{pct}%</Text>
      </View>
      <View style={[statStyles.rateTrack, { backgroundColor: tint + '1A' }]}>
        <View style={[statStyles.rateFill, { width: `${pct}%`, backgroundColor: tint }]} />
      </View>
      {!!sublabel && (
        <Text style={[statStyles.rateSub, { color: colors.onSurfaceVariant }]}>{sublabel}</Text>
      )}
    </View>
  );
}

function formatResponseTime(seconds) {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function GuardProfileScreen() {
  const { colors } = useTheme();
  const user = useSelector(selectCurrentUser);
  const { logout, isLogoutLoading } = useAuth();
  const { data: statsData, isLoading: statsLoading } = useGuardStats();
  const stats = statsData?.data;

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.Content title="Profile" titleStyle={{ fontWeight: '700' }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar card */}
        <Surface style={[styles.avatarCard, { backgroundColor: colors.surface }]} elevation={2}>
          <Avatar.Text
            size={72}
            label={initials}
            style={{ backgroundColor: GUARD_ACCENT }}
            labelStyle={{ color: '#fff', fontWeight: '700', fontSize: 24 }}
          />
          <Text variant="headlineSmall" style={[styles.name, { color: colors.onSurface }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: GUARD_ACCENT + '1A' }]}>
            <Ionicons name="shield-outline" size={13} color={GUARD_ACCENT} />
            <Text
              variant="labelMedium"
              style={{ color: GUARD_ACCENT, fontWeight: '700', marginLeft: 4, textTransform: 'uppercase' }}
            >
              {user?.role ?? 'Guard'}
            </Text>
          </View>
        </Surface>

        {/* Performance stats */}
        <Surface style={[styles.detailsCard, { backgroundColor: colors.surface }]} elevation={2}>
          <Text variant="titleSmall" style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
            Performance
          </Text>
          <Divider style={{ marginBottom: 14 }} />

          {statsLoading ? (
            <Text style={{ color: colors.onSurfaceVariant }}>Loading stats…</Text>
          ) : (
            <>
              <View style={statStyles.tileRow}>
                <StatTile
                  icon="people"
                  label="Visitors Logged"
                  value={stats?.visitors?.totalLogged ?? 0}
                  tint="#1565C0"
                  colors={colors}
                />
                <StatTile
                  icon="warning"
                  label="SOS Attended"
                  value={stats?.sos?.totalAttended ?? 0}
                  tint="#C62828"
                  colors={colors}
                />
                <StatTile
                  icon="timer-outline"
                  label="Avg Response"
                  value={formatResponseTime(stats?.sos?.avgResponseSeconds)}
                  tint={GUARD_ACCENT}
                  colors={colors}
                />
              </View>

              <RateBar
                label="SOS Attendance Rate"
                rate={stats?.sos?.attendanceRate}
                tint="#C62828"
                colors={colors}
                sublabel={`${stats?.sos?.totalAttended ?? 0} of ${stats?.sos?.totalInSociety ?? 0} society-wide SOS alerts handled by you`}
              />
            </>
          )}
        </Surface>

        {/* Contact */}
        <Surface style={[styles.detailsCard, { backgroundColor: colors.surface }]} elevation={2}>
          <Text variant="titleSmall" style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
            Contact Information
          </Text>
          <Divider style={{ marginBottom: 12 }} />
          <ProfileRow icon="mail-outline" label="Email"  value={user?.email}  colors={colors} />
          <ProfileRow icon="call-outline" label="Mobile" value={user?.mobile} colors={colors} />
        </Surface>

        {/* Account */}
        <Surface style={[styles.detailsCard, { backgroundColor: colors.surface }]} elevation={2}>
          <Text variant="titleSmall" style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
            Account Details
          </Text>
          <Divider style={{ marginBottom: 12 }} />
          <ProfileRow
            icon="person-outline"
            label="Name"
            value={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()}
            colors={colors}
          />
          <ProfileRow icon="shield-outline"   label="Role"  value={user?.role} colors={colors} />
          <ProfileRow
            icon="calendar-outline"
            label="Member Since"
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                    month: 'long', year: 'numeric',
                  })
                : null
            }
            colors={colors}
          />
        </Surface>

        <AppButton
          label="Logout"
          mode="outlined"
          onPress={logout}
          loading={isLogoutLoading}
          color={colors.error}
          icon="logout"
          style={styles.logoutBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  avatarCard: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 10 },
  name: { fontWeight: '700', textAlign: 'center' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  detailsCard: { borderRadius: 20, padding: 18 },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    fontWeight: '600',
  },
  logoutBtn: { marginTop: 8, borderRadius: 12 },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconWrap: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  text: { flex: 1 },
});

const statStyles = StyleSheet.create({
  tileRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  tile: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  tileIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  tileValue: { fontSize: 17, fontWeight: '800' },
  tileLabel: { fontSize: 10.5, fontWeight: '600', textAlign: 'center' },

  rateRow: { marginBottom: 16 },
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rateLabel: { fontSize: 13, fontWeight: '700' },
  ratePct: { fontSize: 13, fontWeight: '800' },
  rateTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  rateFill: { height: '100%', borderRadius: 4 },
  rateSub: { fontSize: 11.5, marginTop: 5, fontWeight: '500' },
});