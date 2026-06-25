// src/screens/auth/PendingApprovalScreen.js
import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { clearCredentials, selectCurrentUser } from '../../store/slices/authSlice';
import { clearAuthStorage } from '../../utils/storage';
import { authService } from '../../api/services/authService';
import AppButton from '../../components/common/AppButton';

export default function PendingApprovalScreen() {
  const { colors } = useTheme();
  const dispatch   = useDispatch();
  const user       = useSelector(selectCurrentUser);

  // Subtle pulse animation on the icon
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

const handleLogout = async () => {
  try {
    await authService.logout();
  } catch (_) {}

  await clearAuthStorage();
  dispatch(clearCredentials());
};

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>

        {/* Logo — same as LoginScreen */}
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Animated icon badge */}
        <Animated.View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.warning + '20' },
            { transform: [{ scale: pulse }] },
          ]}
        >
          <Ionicons name="time-outline" size={48} color={colors.warning} />
        </Animated.View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>

          <Text variant="titleLarge" style={[styles.title, { color: colors.onSurface }]}>
            Approval Pending
          </Text>

          {user?.firstName ? (
            <Text variant="bodyMedium" style={[styles.greeting, { color: colors.primary }]}>
              Hi {user.firstName} 👋
            </Text>
          ) : null}

          <Text variant="bodyMedium" style={[styles.body, { color: colors.onSurfaceVariant }]}>
            Your account has been created successfully and is now waiting for
            your society admin to review and approve it.
          </Text>

          <Divider style={styles.divider} />

          {/* What to expect section */}
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: colors.primaryContainer }]}>
              <Ionicons name="checkmark" size={14} color={colors.primary} />
            </View>
            <Text variant="bodySmall" style={[styles.stepText, { color: colors.onSurfaceVariant }]}>
              Registration complete
            </Text>
          </View>

          <View style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: colors.warning + '30' }]}>
              <Ionicons name="time" size={14} color={colors.warning} />
            </View>
            <Text variant="bodySmall" style={[styles.stepText, { color: colors.onSurfaceVariant }]}>
              Waiting for admin approval
            </Text>
          </View>

          <View style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: colors.surfaceVariant }]}>
              <Ionicons name="home-outline" size={14} color={colors.outline} />
            </View>
            <Text variant="bodySmall" style={[styles.stepText, { color: colors.outline }]}>
              Access granted — sign in to continue
            </Text>
          </View>

          <Divider style={styles.divider} />

          <Text variant="bodySmall" style={[styles.hint, { color: colors.onSurfaceVariant }]}>
            This usually happens quickly. If it's taking too long, contact
            your society admin directly.
          </Text>
        </View>

        <AppButton
          label="Sign Out"
          onPress={handleLogout}
          mode="outlined"
          icon="logout"
          style={styles.signOutBtn}
        />

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 4,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    gap: 12,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  greeting: {
    textAlign: 'center',
    fontWeight: '600',
    marginTop: -4,
  },
  body: {
    textAlign: 'center',
    lineHeight: 20,
  },
  divider: {
    marginVertical: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    lineHeight: 18,
  },
  hint: {
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  signOutBtn: {
    width: '100%',
  },
});