// src/screens/admin/AdminProfileScreen.js
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme, Appbar, Surface, Avatar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { AppButton } from '../../components/common';

const ADMIN_ACCENT = '#4A148C';

function ProfileRow({ icon, label, value, colors }) {
  if (!value) return null;
  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.iconWrap, { backgroundColor: ADMIN_ACCENT + '15' }]}>
        <Ionicons name={icon} size={18} color={ADMIN_ACCENT} />
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

export default function AdminProfileScreen() {
  const { colors } = useTheme();
  const user = useSelector(selectCurrentUser);
  const { logout, isLogoutLoading } = useAuth();

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.Content title="Profile" titleStyle={{ fontWeight: '700' }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar card */}
        <Surface style={[styles.avatarCard, { backgroundColor: colors.surface }]} elevation={2}>
          <Avatar.Text
            size={72}
            label={initials}
            style={{ backgroundColor: ADMIN_ACCENT }}
            labelStyle={{ color: '#fff', fontWeight: '700', fontSize: 24 }}
          />
          <Text variant="headlineSmall" style={[styles.name, { color: colors.onSurface }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: ADMIN_ACCENT + '15' }]}>
            <Ionicons name="shield-checkmark-outline" size={13} color={ADMIN_ACCENT} />
            <Text
              variant="labelMedium"
              style={{ color: ADMIN_ACCENT, fontWeight: '700', marginLeft: 4, textTransform: 'uppercase' }}
            >
              {user?.role ?? 'Admin'}
            </Text>
          </View>
        </Surface>

        {/* Contact */}
        <Surface style={[styles.detailsCard, { backgroundColor: colors.surface }]} elevation={2}>
          <Text variant="titleSmall" style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
            Contact Information
          </Text>
          <Divider style={{ marginBottom: 12 }} />
          <ProfileRow icon="mail-outline" label="Email"  value={user?.email}  colors={colors} />
          <ProfileRow icon="phone-outline" label="Mobile" value={user?.mobile} colors={colors} />
        </Surface>

        {/* Account */}
        <Surface style={[styles.detailsCard, { backgroundColor: colors.surface }]} elevation={2}>
          <Text variant="titleSmall" style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
            Account Details
          </Text>
          <Divider style={{ marginBottom: 12 }} />
          <ProfileRow
            icon="account-outline"
            label="Name"
            value={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()}
            colors={colors}
          />
          <ProfileRow icon="shield-checkmark-outline" label="Role" value={user?.role} colors={colors} />
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