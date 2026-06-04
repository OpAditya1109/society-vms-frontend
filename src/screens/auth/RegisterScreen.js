// src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  useTheme,
  SegmentedButtons,
  Menu,
  Button,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { useMutation, useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService }    from '../../api/services/authService';
import { societyService } from '../../api/services/societyService';
import { setCredentials } from '../../store/slices/authSlice';
import { saveTokens }     from '../../utils/storage';
import { ROLES, SCREENS, QUERY_KEYS } from '../../constants';

import AppInput  from '../../components/common/AppInput';
import AppButton from '../../components/common/AppButton';

const ROLE_OPTIONS = [
  { value: ROLES.RESIDENT, label: 'Resident' },
  { value: ROLES.GUARD,    label: 'Guard' },
  { value: ROLES.ADMIN,    label: 'Admin' },
];

// ── Address sub-form default ──────────────────────────────────────────────────
const EMPTY_ADDRESS = { street: '', city: '', state: '', pincode: '' };

export default function RegisterScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const dispatch   = useDispatch();

  const [role, setRole]                 = useState(ROLES.RESIDENT);
  const [societyMenuVisible, setSocietyMenuVisible] = useState(false);

  // Toggle: join existing society vs create new one
  const [createMode, setCreateMode] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    mobile:    '',
    password:  '',
    societyId:   '',
    societyName: '',
    flatNumber: '',
    registrationCode: '',
  });

  // New-society fields (only used in createMode)
  const [newSociety, setNewSociety] = useState({
    name: '',
    address: { ...EMPTY_ADDRESS },
    totalFlats: '',
  });

  const [errors, setErrors] = useState({});

  // ── Fetch existing societies ──────────────────────────────────────────────
  const { data: societiesData, isLoading: loadingSocieties } = useQuery({
    queryKey: QUERY_KEYS.SOCIETIES,
    queryFn: () => societyService.getSocieties(),
    select: (res) => res.data ?? [],
  });
  const societies = societiesData ?? [];

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required';
    if (!form.email.trim())     e.email     = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.mobile.trim())    e.mobile    = 'Mobile number is required';
    else if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = 'Enter a valid 10-digit mobile';
    if (!form.password.trim() || form.password.length < 6)
      e.password = 'Password must be at least 6 characters';

    if (createMode) {
      if (!newSociety.name.trim())             e.newSocietyName    = 'Society name is required';
      if (!newSociety.address.street.trim())   e.street  = 'Street is required';
      if (!newSociety.address.city.trim())     e.city    = 'City is required';
      if (!newSociety.address.state.trim())    e.state   = 'State is required';
      if (!/^\d{6}$/.test(newSociety.address.pincode)) e.pincode = 'Enter a valid 6-digit pincode';
    } else {
      if (!form.societyId) e.societyId = 'Please select a society';
    }

    if (role === ROLES.RESIDENT && !form.flatNumber.trim())
      e.flatNumber = 'Flat number is required for residents';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Mutation: join existing society ──────────────────────────────────────
  const registerMutation = useMutation({
    mutationFn: () =>
      authService.register({
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim().toLowerCase(),
        mobile:    form.mobile.trim(),
        password:  form.password,
        role,
        societyId: form.societyId,
        flatNumber: role === ROLES.RESIDENT ? form.flatNumber.trim() : undefined,
        registrationCode: form.registrationCode.trim() || undefined,
      }),
    onSuccess: async (response) => {
      const { user, accessToken, refreshToken } = response.data;
      await saveTokens(accessToken, refreshToken);
      dispatch(setCredentials({ user, accessToken, refreshToken }));
    },
    onError: (error) => {
      const msg = error?.response?.data?.message ?? error?.message ?? 'Registration failed';
      Toast.show({ type: 'error', text1: 'Registration Failed', text2: msg });
    },
  });

  // ── Mutation: create new society + admin (bootstrap) ──────────────────────
  const bootstrapMutation = useMutation({
    mutationFn: () =>
      societyService.bootstrapSociety({
        society: {
          name: newSociety.name.trim(),
          address: {
            street:  newSociety.address.street.trim(),
            city:    newSociety.address.city.trim(),
            state:   newSociety.address.state.trim(),
            pincode: newSociety.address.pincode.trim(),
          },
          totalFlats: newSociety.totalFlats ? Number(newSociety.totalFlats) : undefined,
        },
        admin: {
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          email:     form.email.trim().toLowerCase(),
          mobile:    form.mobile.trim(),
          password:  form.password,
        },
      }),
    onSuccess: async (response) => {
      const { user, accessToken, refreshToken } = response.data;
      await saveTokens(accessToken, refreshToken);
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      Toast.show({
        type: 'success',
        text1: 'Society Created!',
        text2: `"${response.data?.society?.name}" is ready. You are logged in as admin.`,
      });
    },
    onError: (error) => {
      const msg = error?.response?.data?.message ?? error?.message ?? 'Failed to create society';
      // If societies already exist, switch back to join mode
      if (error?.response?.status === 403) {
        setCreateMode(false);
        Toast.show({
          type: 'info',
          text1: 'Societies Exist',
          text2: 'Please select your society from the list.',
        });
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: msg });
      }
    },
  });

  const handleSubmit = () => {
    if (!validate()) return;
    if (createMode) {
      bootstrapMutation.mutate();
    } else {
      registerMutation.mutate();
    }
  };

  const isLoading = registerMutation.isPending || bootstrapMutation.isPending;

  const set = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const setAddr = (field) => (value) => {
    setNewSociety((s) => ({ ...s, address: { ...s.address, [field]: value } }));
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
          {/* Back link */}
          <Text
            style={[styles.backLink, { color: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            ← Back to Login
          </Text>

          <Text variant="headlineMedium" style={[styles.title, { color: colors.onBackground }]}>
            Create Account
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, marginBottom: 24 }}>
            Join your society on Society VMS
          </Text>

          {/* Role selector — only shown when joining existing */}
          {!createMode && (
            <>
              <Text variant="labelLarge" style={[styles.sectionLabel, { color: colors.onSurface }]}>
                I am a…
              </Text>
              <SegmentedButtons
                value={role}
                onValueChange={setRole}
                buttons={ROLE_OPTIONS}
                style={styles.segmented}
              />
            </>
          )}

          {/* Form card */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>

            {/* ── Personal details ──────────────────────────────────── */}
            <View style={styles.row}>
              <AppInput
                label="First Name"
                value={form.firstName}
                onChangeText={set('firstName')}
                error={errors.firstName}
                left="account-outline"
                style={styles.halfInput}
              />
              <AppInput
                label="Last Name"
                value={form.lastName}
                onChangeText={set('lastName')}
                error={errors.lastName}
                style={styles.halfInput}
              />
            </View>

            <AppInput
              label="Email Address"
              value={form.email}
              onChangeText={set('email')}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              left="email-outline"
              style={styles.field}
            />

            <AppInput
              label="Mobile Number"
              value={form.mobile}
              onChangeText={set('mobile')}
              error={errors.mobile}
              keyboardType="phone-pad"
              left="phone-outline"
              style={styles.field}
            />

            <AppInput
              label="Password"
              value={form.password}
              onChangeText={set('password')}
              error={errors.password}
              secureText
              left="lock-outline"
              style={styles.field}
            />

            <Divider style={{ marginVertical: 16 }} />

            {/* ── Society section ───────────────────────────────────── */}
            <Text variant="titleSmall" style={[styles.sectionHeader, { color: colors.onSurface }]}>
              Society
            </Text>

            {/* Toggle: join vs create */}
            <View style={styles.toggleRow}>
              <Button
                mode={!createMode ? 'contained' : 'outlined'}
                onPress={() => setCreateMode(false)}
                style={styles.toggleBtn}
                compact
              >
                Join Existing
              </Button>
              <Button
                mode={createMode ? 'contained' : 'outlined'}
                onPress={() => { setCreateMode(true); setRole(ROLES.ADMIN); }}
                style={styles.toggleBtn}
                compact
              >
                + Create New
              </Button>
            </View>

            {createMode ? (
              /* ── Create new society fields ──────────────────────── */
              <View style={{ gap: 0 }}>
                <Text variant="bodySmall" style={[styles.hint, { color: colors.onSurfaceVariant }]}>
                  You will be registered as the admin of this new society.
                </Text>

                <AppInput
                  label="Society Name *"
                  value={newSociety.name}
                  onChangeText={(v) => {
                    setNewSociety((s) => ({ ...s, name: v }));
                    if (errors.newSocietyName) setErrors((e) => ({ ...e, newSocietyName: undefined }));
                  }}
                  error={errors.newSocietyName}
                  left="office-building-outline"
                  style={styles.field}
                />

                <AppInput
                  label="Street Address *"
                  value={newSociety.address.street}
                  onChangeText={setAddr('street')}
                  error={errors.street}
                  left="map-marker-outline"
                  style={styles.field}
                />

                <View style={styles.row}>
                  <AppInput
                    label="City *"
                    value={newSociety.address.city}
                    onChangeText={setAddr('city')}
                    error={errors.city}
                    style={styles.halfInput}
                  />
                  <AppInput
                    label="State *"
                    value={newSociety.address.state}
                    onChangeText={setAddr('state')}
                    error={errors.state}
                    style={styles.halfInput}
                  />
                </View>

                <View style={styles.row}>
                  <AppInput
                    label="Pincode *"
                    value={newSociety.address.pincode}
                    onChangeText={setAddr('pincode')}
                    error={errors.pincode}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={styles.halfInput}
                  />
                  <AppInput
                    label="Total Flats"
                    value={newSociety.totalFlats}
                    onChangeText={(v) => setNewSociety((s) => ({ ...s, totalFlats: v }))}
                    keyboardType="number-pad"
                    style={styles.halfInput}
                  />
                </View>
              </View>
            ) : (
              /* ── Join existing society fields ────────────────────── */
              <View>
                <Text variant="labelMedium" style={[styles.pickerLabel, { color: colors.onSurfaceVariant }]}>
                  Select Society *
                </Text>
                <Menu
                  visible={societyMenuVisible}
                  onDismiss={() => setSocietyMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setSocietyMenuVisible(true)}
                      style={[
                        styles.societyBtn,
                        { borderColor: errors.societyId ? colors.error : colors.outline },
                      ]}
                      contentStyle={{ justifyContent: 'flex-start' }}
                      icon="office-building-outline"
                      loading={loadingSocieties}
                    >
                      {form.societyName || (loadingSocieties ? 'Loading…' : 'Select Society')}
                    </Button>
                  }
                >
                  {societies.length === 0 ? (
                    <Menu.Item title="No societies found — create one instead" disabled />
                  ) : (
                    societies.map((s) => (
                      <Menu.Item
                        key={s._id}
                        title={s.name}
                        description={`${s.address?.city}, ${s.address?.state}`}
                        onPress={() => {
                          setForm((f) => ({ ...f, societyId: s._id, societyName: s.name }));
                          if (errors.societyId) setErrors((e) => ({ ...e, societyId: undefined }));
                          setSocietyMenuVisible(false);
                        }}
                      />
                    ))
                  )}
                </Menu>
                {!!errors.societyId && (
                  <Text variant="bodySmall" style={{ color: colors.error, marginTop: 4 }}>
                    {errors.societyId}
                  </Text>
                )}

                {/* Flat number — residents only */}
                {role === ROLES.RESIDENT && (
                  <AppInput
                    label="Flat / Unit Number *"
                    value={form.flatNumber}
                    onChangeText={set('flatNumber')}
                    error={errors.flatNumber}
                    left="home-outline"
                    style={styles.field}
                  />
                )}

                {/* Registration code */}
                {role !== ROLES.ADMIN && (
                  <AppInput
                    label="Society Registration Code (optional)"
                    value={form.registrationCode}
                    onChangeText={set('registrationCode')}
                    left="key-outline"
                    style={styles.field}
                  />
                )}
              </View>
            )}

            <AppButton
              label={createMode ? 'Create Society & Register' : 'Create Account'}
              onPress={handleSubmit}
              loading={isLoading}
              style={styles.registerBtn}
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.loginRow}>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
              Already have an account?{' '}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: colors.primary, fontWeight: '700' }}
              onPress={() => navigation.navigate(SCREENS.LOGIN)}
            >
              Sign In
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24 },
  backLink: { marginBottom: 16, fontWeight: '600' },
  title: { fontWeight: '700' },
  sectionLabel: { marginBottom: 8 },
  segmented: { marginBottom: 24 },
  card: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  field: { marginTop: 12 },
  sectionHeader: { fontWeight: '700', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  toggleBtn: { flex: 1, borderRadius: 10 },
  hint: { marginBottom: 8, fontStyle: 'italic' },
  pickerLabel: { marginTop: 4, marginBottom: 4 },
  societyBtn: {
    borderRadius: 12,
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  registerBtn: { marginTop: 20 },
  divider: { marginVertical: 24 },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
});