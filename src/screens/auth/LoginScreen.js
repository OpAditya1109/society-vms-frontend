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
      const msg =
        error?.response?.data?.message ?? error?.message ?? 'Login failed';
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
            <Text variant="headlineMedium" style={[styles.title, { color: colors.onBackground }]}>
              Welcome Back
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
              Sign in to your 7 Days account
            </Text>
          </View>

          {/* Form */}
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
  divider: {
    marginVertical: 24,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});