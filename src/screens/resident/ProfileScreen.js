// src/screens/resident/ProfileScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Text, useTheme, Appbar, Surface, Avatar, Divider, Modal, Portal,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { AppButton, AppInput } from '../../components/common';
import { SCREENS } from '../../constants';

// ── Zod schema for profile edit ──────────────────────────────────────────────
const profileSchema = z
  .object({
    firstName:       z.string().trim().min(1, 'First name is required').max(50),
    lastName:        z.string().trim().min(1, 'Last name is required').max(50),
    mobile:          z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
    currentPassword: z.string().optional(),
    newPassword:     z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (d) => !d.newPassword || d.newPassword.length >= 6,
    { message: 'New password must be at least 6 characters', path: ['newPassword'] },
  )
  .refine(
    (d) => !d.newPassword || d.newPassword === d.confirmPassword,
    { message: 'Passwords do not match', path: ['confirmPassword'] },
  )
  .refine(
    (d) => !d.newPassword || !!d.currentPassword,
    { message: 'Current password is required', path: ['currentPassword'] },
  );

// ── Sub-components ───────────────────────────────────────────────────────────
function ProfileRow({ icon, label, value, colors }) {
  if (!value) return null;
  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.iconWrap, { backgroundColor: colors.primaryContainer }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={rowStyles.text}>
        <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {label}
        </Text>
        <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function QuickActionCard({ icon, label, color, onPress, colors }) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: color + '30', borderWidth: 1.5 }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text variant="labelMedium" style={{ color: colors.onSurface, fontWeight: '700', marginTop: 8, textAlign: 'center' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { colors } = useTheme();
  const user = useSelector(selectCurrentUser);
  const { logout, isLogoutLoading, updateProfile, isUpdateProfileLoading } = useAuth();
  const navigation = useNavigation();
  const [editModal, setEditModal] = useState(false);

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean).join('').toUpperCase() || '?';

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName:       user?.firstName ?? '',
      lastName:        user?.lastName  ?? '',
      mobile:          user?.mobile    ?? '',
      currentPassword: '',
      newPassword:     '',
      confirmPassword: '',
    },
  });

  const openEdit = () => {
    reset({
      firstName:       user?.firstName ?? '',
      lastName:        user?.lastName  ?? '',
      mobile:          user?.mobile    ?? '',
      currentPassword: '',
      newPassword:     '',
      confirmPassword: '',
    });
    setEditModal(true);
  };

  const onSubmit = (values) => {
    const payload = {
      firstName: values.firstName,
      lastName:  values.lastName,
      mobile:    values.mobile,
    };
    if (values.newPassword) {
      payload.currentPassword = values.currentPassword;
      payload.newPassword     = values.newPassword;
    }
    updateProfile(payload, { onSuccess: () => setEditModal(false) });
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.Content title="My Profile" titleStyle={{ fontWeight: '700' }} />
        <Appbar.Action icon="pencil-outline" onPress={openEdit} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar card */}
        <Surface style={[styles.avatarCard, { backgroundColor: colors.surface }]} elevation={2}>
          <Avatar.Text size={72} label={initials}
            style={{ backgroundColor: colors.primary }}
            labelStyle={{ color: colors.onPrimary, fontWeight: '700', fontSize: 24 }}
          />
          <Text variant="headlineSmall" style={[styles.name, { color: colors.onSurface }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          {user?.flatNumber && (
            <View style={[styles.flatBadge, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons name="home-outline" size={13} color={colors.primary} />
              <Text variant="labelMedium" style={{ color: colors.primary, fontWeight: '700', marginLeft: 4 }}>
                Flat {user.flatNumber}
              </Text>
            </View>
          )}
          <View style={[styles.roleBadge, { backgroundColor: colors.secondaryContainer }]}>
            <Text variant="labelSmall" style={{ color: colors.secondary, fontWeight: '700', textTransform: 'uppercase' }}>
              {user?.role ?? 'Resident'}
            </Text>
          </View>
        </Surface>

        {/* Resident Profile Modules */}
        <Surface style={[styles.sectionCard, { backgroundColor: colors.surface }]} elevation={2}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={18} color={colors.primary} />
            <Text variant="titleSmall" style={{ fontWeight: '700', color: colors.onSurface, marginLeft: 8 }}>
              Resident Profile
            </Text>
          </View>
          <Divider style={{ marginBottom: 14 }} />
          <View style={styles.actionGrid}>
            <QuickActionCard icon="people-outline"    label="Family Members" color="#1565C0" colors={colors} onPress={() => navigation.navigate(SCREENS.RESIDENT_FAMILY_MEMBERS)} />
            <QuickActionCard icon="person-add-outline" label="Daily Help"    color="#00897B" colors={colors} onPress={() => navigation.navigate(SCREENS.RESIDENT_DAILY_HELP)} />
            <QuickActionCard icon="car-outline"        label="Vehicles"      color="#E65100" colors={colors} onPress={() => navigation.navigate(SCREENS.RESIDENT_VEHICLES)} />
          </View>
        </Surface>

        {/* Contact */}
        <Surface style={[styles.sectionCard, { backgroundColor: colors.surface }]} elevation={2}>
          <Text variant="titleSmall" style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>Contact Information</Text>
          <Divider style={{ marginBottom: 12 }} />
          <ProfileRow icon="mail-outline" label="Email"  value={user?.email}  colors={colors} />
          <ProfileRow icon="call-outline" label="Mobile" value={user?.mobile} colors={colors} />
        </Surface>

        {/* Account */}
        <Surface style={[styles.sectionCard, { backgroundColor: colors.surface }]} elevation={2}>
          <Text variant="titleSmall" style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>Account Details</Text>
          <Divider style={{ marginBottom: 12 }} />
          <ProfileRow icon="person-outline"   label="Name"        value={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()} colors={colors} />
          <ProfileRow icon="shield-outline"   label="Role"        value={user?.role}       colors={colors} />
          <ProfileRow icon="home-outline"     label="Flat Number" value={user?.flatNumber} colors={colors} />
          <ProfileRow icon="calendar-outline" label="Member Since"
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : null}
            colors={colors}
          />
        </Surface>

        <AppButton label="Logout" mode="outlined" onPress={logout} loading={isLogoutLoading}
          color={colors.error} icon="logout" style={styles.logoutBtn} />
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Portal>
        <Modal
          visible={editModal}
          onDismiss={() => !isUpdateProfileLoading && setEditModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text variant="titleMedium" style={{ flex: 1, fontWeight: '700', color: colors.onSurface }}>
                Edit Profile
              </Text>
            </View>
            <Divider style={{ marginBottom: 16 }} />

            <View style={{ gap: 4 }}>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="First Name"
                    value={value}
                    onChangeText={onChange}
                    error={errors.firstName?.message}
                    left="person-outline"
                  />
                )}
              />
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Last Name"
                    value={value}
                    onChangeText={onChange}
                    error={errors.lastName?.message}
                    left="person-outline"
                  />
                )}
              />
              <Controller
                control={control}
                name="mobile"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Mobile Number"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    error={errors.mobile?.message}
                    left="call-outline"
                  />
                )}
              />

              <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant, marginTop: 12, marginBottom: 4 }}>
                Change Password (optional)
              </Text>
              <Divider style={{ marginBottom: 8 }} />

              <Controller
                control={control}
                name="currentPassword"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Current Password"
                    value={value}
                    onChangeText={onChange}
                    secureText
                    error={errors.currentPassword?.message}
                    left="lock-closed"
                  />
                )}
              />
              <Controller
                control={control}
                name="newPassword"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="New Password"
                    value={value}
                    onChangeText={onChange}
                    secureText
                    error={errors.newPassword?.message}
                    left="lock-open-outline"
                  />
                )}
              />
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Confirm New Password"
                    value={value}
                    onChangeText={onChange}
                    secureText
                    error={errors.confirmPassword?.message}
                    left="checkmark-circle-outline"
                  />
                )}
              />
            </View>

            <View style={styles.modalActions}>
              <AppButton
                label="Cancel"
                mode="outlined"
                onPress={() => setEditModal(false)}
                style={{ flex: 1 }}
                disabled={isUpdateProfileLoading}
              />
              <AppButton
                label="Save Changes"
                onPress={handleSubmit(onSubmit)}
                loading={isUpdateProfileLoading}
                style={{ flex: 2 }}
              />
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  avatarCard: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 10 },
  name: { fontWeight: '700', textAlign: 'center' },
  flatBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  sectionCard: { borderRadius: 20, padding: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, fontWeight: '600' },
  actionGrid: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoutBtn: { marginTop: 8, borderRadius: 12 },
  modal: { margin: 20, borderRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
});