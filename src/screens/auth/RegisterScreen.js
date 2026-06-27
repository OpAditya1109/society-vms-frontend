// src/screens/auth/RegisterScreen.js
import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import {
  Text,
  useTheme,
  SegmentedButtons,
  Menu,
  Button,
  Divider,
  TextInput,
  Modal,
  Portal,
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
import { COUNTRIES, INDIAN_STATES, MOBILE_LENGTH } from '../../constants/countryStateData';

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

  // Mobile + Country Code
  const [countryCode, setCountryCode] = useState(COUNTRIES[0]); // Default to India
  const [countryMenuVisible, setCountryMenuVisible] = useState(false);

  // Search society
  const [societySearch, setSocietySearch] = useState('');

  // State/City dropdowns
  const [stateMenuVisible, setStateMenuVisible] = useState(false);
  const [cityMenuVisible, setCityMenuVisible] = useState(false);

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

  // Filter societies by search term
  const filteredSocieties = useMemo(() => {
    if (!societySearch.trim()) return societies;
    const term = societySearch.toLowerCase();
    return societies.filter(s => 
      s.name.toLowerCase().includes(term) ||
      s.address?.city?.toLowerCase().includes(term) ||
      s.address?.state?.toLowerCase().includes(term)
    );
  }, [societies, societySearch]);

  // Get available cities for selected state
  const availableCities = useMemo(() => {
    return INDIAN_STATES[newSociety.address.state] || [];
  }, [newSociety.address.state]);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required';
    if (!form.email.trim())     e.email     = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.mobile.trim())    e.mobile    = 'Mobile number is required';
    else if (!/^\d{10}$/.test(form.mobile)) e.mobile = `Enter a valid ${MOBILE_LENGTH}-digit mobile`;
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
        mobile:    `${countryCode.code}${form.mobile.trim()}`,
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
          mobile:    form.mobile.trim(), // raw 10-digit — backend zod expects /^[6-9]\d{9}$/
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
    <SafeAreaView edges={['bottom']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
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
            ← Back
          </Text>

          <Text variant="headlineSmall" style={[styles.title, { color: colors.onBackground }]}>
            Create Account
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {/* Role Selection */}
            <Text variant="labelMedium" style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
              I am a...
            </Text>
            <SegmentedButtons
              value={role}
              onValueChange={(r) => { setRole(r); if (r !== "admin") setCreateMode(false); }}
              buttons={ROLE_OPTIONS}
              style={styles.segmented}
            />

            {/* Personal Info */}
            <Text variant="labelMedium" style={[styles.sectionHeader, { color: colors.onSurface }]}>
              Personal Information
            </Text>

            <AppInput
              label="First Name *"
              value={form.firstName}
              onChangeText={set('firstName')}
              error={errors.firstName}
              left="person-outline"
              style={styles.field}
            />

            <AppInput
              label="Last Name *"
              value={form.lastName}
              onChangeText={set('lastName')}
              error={errors.lastName}
              left="person-outline"
              style={styles.field}
            />

            <AppInput
              label="Email *"
              value={form.email}
              onChangeText={set('email')}
              error={errors.email}
              keyboardType="email-address"
              left="mail-outline"
              style={styles.field}
            />

            {/* Mobile with Country Code */}
            <Text variant="labelMedium" style={[styles.pickerLabel, { color: colors.onSurfaceVariant }]}>
              Mobile Number *
            </Text>
            <View style={styles.mobileRow}>
              <Menu
                visible={countryMenuVisible}
                onDismiss={() => setCountryMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setCountryMenuVisible(true)}
                    style={[styles.countryBtn, { borderColor: colors.outline }]}
                    labelStyle={styles.countryBtnLabel}
                    compact
                  >
                    {`${countryCode.flag} ${countryCode.code}`}
                  </Button>
                }
              >
                {COUNTRIES.map((c) => (
                  <Menu.Item
                    key={c.id}
                    title={`${c.flag} ${c.name}`}
                    description={c.code}
                    onPress={() => {
                      setCountryCode(c);
                      setCountryMenuVisible(false);
                    }}
                  />
                ))}
              </Menu>

              <TextInput
                label="10-digit"
                value={form.mobile}
                onChangeText={(v) => {
                  const digits = v.replace(/\D/g, '').slice(0, MOBILE_LENGTH);
                  set('mobile')(digits);
                }}
                mode="outlined"
                keyboardType="number-pad"
                maxLength={MOBILE_LENGTH}
                outlineColor={colors.outline}
                activeOutlineColor={colors.primary}
                style={styles.mobileInput}
                outlineStyle={{ borderRadius: 12 }}
              />
            </View>
            {!!errors.mobile && (
              <Text variant="bodySmall" style={{ color: colors.error, marginTop: 4 }}>
                {errors.mobile}
              </Text>
            )}

            <AppInput
              label="Password *"
              value={form.password}
              onChangeText={set('password')}
              error={errors.password}
              secureText
              left="lock-closed-outline"
              style={styles.field}
            />

            {/* Society Selection */}
            <Text variant="labelMedium" style={[styles.sectionHeader, { color: colors.onSurface, marginTop: 20 }]}>
              Society
            </Text>

            <View style={styles.toggleRow}>
              <Button
                mode={!createMode ? 'contained' : 'outlined'}
                onPress={() => setCreateMode(false)}
                style={styles.toggleBtn}
                compact
              >
                Join Existing
              </Button>
              {/* Only admins can create a new society */}
              {role === ROLES.ADMIN && (
                <Button
                  mode={createMode ? 'contained' : 'outlined'}
                  onPress={() => setCreateMode(true)}
                  style={styles.toggleBtn}
                  compact
                >
                  + Create New
                </Button>
              )}
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
                  left="location-outline"
                  style={styles.field}
                />

                {/* State Dropdown */}
                <Text variant="labelMedium" style={[styles.pickerLabel, { color: colors.onSurfaceVariant }]}>
                  State *
                </Text>
                <Menu
                  visible={stateMenuVisible}
                  onDismiss={() => setStateMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setStateMenuVisible(true)}
                      style={[
                        styles.societyBtn,
                        { borderColor: errors.state ? colors.error : colors.outline },
                      ]}
                      contentStyle={{ justifyContent: 'flex-start' }}
                      icon="map-outline"
                    >
                      {newSociety.address.state || 'Select State'}
                    </Button>
                  }
                >
                  {Object.keys(INDIAN_STATES).map((state) => (
                    <Menu.Item
                      key={state}
                      title={state}
                      onPress={() => {
                        setAddr('state')(state);
                        setAddr('city')(''); // Reset city when state changes
                        if (errors.state) setErrors((e) => ({ ...e, state: undefined }));
                        setStateMenuVisible(false);
                      }}
                    />
                  ))}
                </Menu>
                {!!errors.state && (
                  <Text variant="bodySmall" style={{ color: colors.error, marginTop: 4 }}>
                    {errors.state}
                  </Text>
                )}

                {/* City Dropdown - only show if state is selected */}
                {newSociety.address.state && (
                  <>
                    <Text variant="labelMedium" style={[styles.pickerLabel, { color: colors.onSurfaceVariant }]}>
                      City *
                    </Text>
                    <Menu
                      visible={cityMenuVisible}
                      onDismiss={() => setCityMenuVisible(false)}
                      anchor={
                        <Button
                          mode="outlined"
                          onPress={() => setCityMenuVisible(true)}
                          style={[
                            styles.societyBtn,
                            { borderColor: errors.city ? colors.error : colors.outline },
                          ]}
                          contentStyle={{ justifyContent: 'flex-start' }}
                          icon="city"
                        >
                          {newSociety.address.city || 'Select City'}
                        </Button>
                      }
                    >
                      {availableCities.map((city) => (
                        <Menu.Item
                          key={city}
                          title={city}
                          onPress={() => {
                            setAddr('city')(city);
                            if (errors.city) setErrors((e) => ({ ...e, city: undefined }));
                            setCityMenuVisible(false);
                          }}
                        />
                      ))}
                    </Menu>
                    {!!errors.city && (
                      <Text variant="bodySmall" style={{ color: colors.error, marginTop: 4 }}>
                        {errors.city}
                      </Text>
                    )}
                  </>
                )}

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
                
                {/* Search Bar */}
                <TextInput
                  placeholder="Search by name, city, or state..."
                  value={societySearch}
                  onChangeText={setSocietySearch}
                  mode="outlined"
                  left={<TextInput.Icon icon="magnify" />}
                  right={societySearch ? <TextInput.Icon icon="close" onPress={() => setSocietySearch('')} /> : undefined}
                  outlineColor={colors.outline}
                  activeOutlineColor={colors.primary}
                  style={[styles.field, { marginBottom: 8 }]}
                  outlineStyle={{ borderRadius: 12 }}
                />

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
                  {filteredSocieties.length === 0 ? (
                    <Menu.Item title={societySearch ? 'No matching societies' : 'No societies found — create one instead'} disabled />
                  ) : (
                    filteredSocieties.map((s) => (
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
  pickerLabel: { marginTop: 12, marginBottom: 8 },
  societyBtn: {
    borderRadius: 12,
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  mobileRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 4,
    height: 56,
  },
  countryBtn: {
    borderRadius: 12,
    minWidth: 90,
    maxWidth: 100,
    paddingHorizontal: 0,
    height: 56,
    justifyContent: 'center',
  },
  countryBtnLabel: {
    fontSize: 13,
    marginVertical: 0,
    lineHeight: 20,
  },
  mobileInput: {
    backgroundColor: 'transparent',
    flex: 1,
    height: 56,
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