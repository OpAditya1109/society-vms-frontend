// src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { authService }    from '../../api/services/authService';
import { setCredentials } from '../../store/slices/authSlice';
import { saveTokens }     from '../../utils/storage';
import { SCREENS }        from '../../constants';

import AppInput  from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';

export default function LoginScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const dispatch   = useDispatch();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  // Shown instead of the form when the account exists but is awaiting admin approval
  const [pendingApproval, setPendingApproval] = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.email.trim())    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password.trim()) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Mutation — POST /api/auth/login ────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: () => authService.login(form),
    onSuccess: async (response) => {
      const { user, accessToken, refreshToken } = response.data;
      await saveTokens(accessToken, refreshToken);
      dispatch(setCredentials({ user, accessToken, refreshToken }));
    },
    onError: (error) => {
      const status = error?.response?.status;
      const msg =
        error?.response?.data?.message ?? error?.message ?? 'Login failed';

      // Account exists but admin hasn't approved it yet — show a proper
      // dedicated state instead of dumping the raw error in a toast.
      const isPendingApproval =
        status === 403 && /pending admin approval/i.test(msg);

      if (isPendingApproval) {
        setPendingApproval(true);
        return;
      }

      Toast.show({ type: 'error', text1: 'Login Failed', text2: msg });
    },
  });

  const handleLogin = () => {
    if (!validate()) return;
    loginMutation.mutate();
  };

  const set = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleBackToLogin = () => {
    setPendingApproval(false);
    setForm((f) => ({ ...f, password: '' }));
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoMini}
              resizeMode="contain"
            />
            {!pendingApproval && (
              <>
                <Text variant="headlineMedium" style={[styles.title, { color: colors.onBackground }]}>
                  Welcome Back
                </Text>
                <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
                  Sign in to your 7 Days account
                </Text>
              </>
            )}
          </View>

          {pendingApproval ? (
            /* ── Pending admin approval state ──────────────────────── */
            <View style={[styles.card, styles.pendingCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.pendingIconWrap, { backgroundColor: colors.warning + '1F' }]}>
                <Ionicons name="time-outline" size={40} color={colors.warning} />
              </View>

              <Text
                variant="titleLarge"
                style={[styles.pendingTitle, { color: colors.onSurface }]}
              >
                Approval Pending
              </Text>

              <Text
                variant="bodyMedium"
                style={[styles.pendingMessage, { color: colors.onSurfaceVariant }]}
              >
                Your account has been created and is waiting for your society
                admin to approve it. You'll be able to sign in as soon as
                that's done.
              </Text>

              <View style={[styles.pendingDivider, { backgroundColor: colors.outlineVariant }]} />

              <Text
                variant="bodySmall"
                style={[styles.pendingHint, { color: colors.onSurfaceVariant }]}
              >
                This usually doesn't take long. If it's been a while, reach
                out to your society admin directly.
              </Text>

              <AppButton
                label="Back to Sign In"
                onPress={handleBackToLogin}
                mode="outlined"
                style={styles.pendingBtn}
              />
            </View>
          ) : (
            /* ── Form ───────────────────────────────────────────────── */
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <AppInput
                label="Email Address"
                value={form.email}
                onChangeText={set('email')}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                left="email-outline"
              />

              <AppInput
                label="Password"
                value={form.password}
                onChangeText={set('password')}
                error={errors.password}
                secureText
                left="lock-outline"
                style={{ marginTop: 12 }}
              />

              <AppButton
                label="Sign In"
                onPress={handleLogin}
                loading={loginMutation.isPending}
                style={styles.loginBtn}
              />
            </View>
          )}

          {!pendingApproval && (
            <>
              <Divider style={styles.divider} />

              {/* Register link */}
              <View style={styles.registerRow}>
                <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
                  Don't have an account?{' '}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ color: colors.primary, fontWeight: '700' }}
                  onPress={() => navigation.navigate(SCREENS.REGISTER)}
                >
                  Register
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  logoMini: {
    width: 90,
    height: 90,
    marginBottom: 8,
  },
  title: {
    fontWeight: '700',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  loginBtn: {
    marginTop: 20,
  },
  pendingCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  pendingIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pendingTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  pendingMessage: {
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  pendingDivider: {
    height: 1,
    width: '100%',
    marginVertical: 20,
  },
  pendingHint: {
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  pendingBtn: {
    width: '100%',
  },
  divider: {
    marginVertical: 24,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});