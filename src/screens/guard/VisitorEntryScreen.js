// src/screens/guard/VisitorEntryScreen.js
import React, { useState, useRef } from 'react';
import {
  View, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableOpacity,
  Image, Alert,
} from 'react-native';
import { Text, useTheme, Appbar, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

import { useCreateVisitor } from '../../hooks/useVisitorLogs';
import { AppInput, AppButton } from '../../components/common';
import { societyService } from '../../api/services/societyService';
import { visitorService } from '../../api/services/visitorService';

const GUARD_ACCENT = '#E65100';

const visitorSchema = z.object({
  name: z
    .string()
    .min(2, 'Visitor name must be at least 2 characters')
    .max(60, 'Name too long'),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  purpose: z
    .string()
    .min(3, 'Please describe the purpose of visit')
    .max(120, 'Purpose too long'),
  flatNumber: z
    .string()
    .min(1, 'Flat number is required')
    .max(10, 'Flat number too long'),
  residentId: z
    .string()
    .min(1, 'Please select a resident from the list'),
});

export default function VisitorEntryScreen({ navigation }) {
  const { colors } = useTheme();
  const { mutate: createVisitor, isPending } = useCreateVisitor();

  const [flatSearch, setFlatSearch] = useState('');
  const [debouncedFlat, setDebouncedFlat] = useState('');
  const [selectedResident, setSelectedResident] = useState(null);

  // Photo state
  const [photoUri, setPhotoUri] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);  // Cloudinary URL after upload
  const [isUploading, setIsUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  // Inline debounce — no lodash needed
  const debounceTimer = useRef(null);
  const debounceSetFlat = (val) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedFlat(val), 400);
  };

  const { data: residentsData, isFetching: isSearching } = useQuery({
    queryKey: ['residentSearch', debouncedFlat],
    queryFn: () => societyService.searchResidents(debouncedFlat),
    enabled: debouncedFlat.length >= 1 && !selectedResident,
    staleTime: 30_000,
  });

  const residents = residentsData?.data ?? [];

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(visitorSchema),
    defaultValues: { name: '', mobile: '', purpose: '', flatNumber: '', residentId: '' },
  });

  const handleFlatChange = (val) => {
    setFlatSearch(val);
    if (selectedResident) {
      setSelectedResident(null);
      setValue('residentId', '');
      setValue('flatNumber', '');
    }
    debounceSetFlat(val);
  };

  const handleSelectResident = (resident) => {
    setSelectedResident(resident);
    setFlatSearch(resident.flatNumber);
    setValue('flatNumber', resident.flatNumber);
    setValue('residentId', resident._id);
    setDebouncedFlat(''); // collapse dropdown
  };

  const clearResident = () => {
    setSelectedResident(null);
    setValue('residentId', '');
    setValue('flatNumber', '');
    setFlatSearch('');
    setDebouncedFlat('');
  };

  // ── Camera ──────────────────────────────────────────────────────────────────

const handleCapturePhoto = async () => {
  setPhotoError(null);

  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    setPhotoError('Camera permission is required to capture visitor photo.');
    Alert.alert(
      'Permission Required',
      'Camera access is needed. Please enable it in device Settings.',
      [{ text: 'OK' }],
    );
    return;
  }

  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'Images',  // ← fixed (no more MediaTypeOptions)
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setPhotoUri(uri);
    setPhotoUrl(null);
    await uploadPhoto(uri);
  } catch (err) {
    console.error('[Camera] Error:', err);
    setPhotoError('Failed to open camera. Please try again.');
    Alert.alert('Camera Error', err.message ?? 'Could not open camera.');
  }
};

  const uploadPhoto = async (uri) => {
    setIsUploading(true);
    setPhotoError(null);
    try {
      const response = await visitorService.uploadVisitorPhoto(uri);
      if (response?.success && response?.data?.photoUrl) {
        setPhotoUrl(response.data.photoUrl);
        Toast.show({
          type: 'success',
          text1: 'Photo Uploaded',
          text2: 'Visitor photo saved successfully.',
        });
      } else {
        throw new Error('Unexpected response from server.');
      }
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Photo upload failed. Please try again.';
      setPhotoError(msg);
      setPhotoUrl(null);
      Toast.show({ type: 'error', text1: 'Upload Failed', text2: msg });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetakePhoto = () => {
    setPhotoUri(null);
    setPhotoUrl(null);
    setPhotoError(null);
    handleCapturePhoto();
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const onSubmit = (values) => {
    if (!photoUrl) {
      setPhotoError('Visitor photo is required. Please capture a photo before submitting.');
      Toast.show({
        type: 'error',
        text1: 'Photo Required',
        text2: 'Please capture a visitor photo before logging entry.',
      });
      return;
    }

    createVisitor(
      { ...values, photoUrl },
      {
        onSuccess: (result) => {
          reset();
          setFlatSearch('');
          setSelectedResident(null);
          setPhotoUri(null);
          setPhotoUrl(null);
          setPhotoError(null);

          // Navigate to OTP screen instead of going back
          navigation.navigate('OtpVerify', {
            visitorId:     result.data._id,
            visitorMobile: values.mobile,
            visitorName:   values.name,
          });
        },
      },
    );
  };

  const showDropdown = !selectedResident && debouncedFlat.length >= 1;
  const isSubmitDisabled = isPending || isUploading;

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation?.goBack()} />
        <Appbar.Content title="Log Visitor" titleStyle={{ fontWeight: '700' }} />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.banner, { backgroundColor: GUARD_ACCENT + '12' }]}>
            <Text variant="bodyMedium" style={{ color: GUARD_ACCENT, fontWeight: '600' }}>
              Fill in visitor details below. The resident will be notified for approval.
            </Text>
          </View>

          {/* ── Visitor Photo ── */}
          <Text variant="titleSmall" style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
            Visitor Photo *
          </Text>

          <View style={[styles.photoSection, { backgroundColor: colors.surface, borderColor: photoError ? colors.error : colors.outline }]}>
            {photoUri ? (
              // Photo preview
              <View style={styles.previewContainer}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />

                {/* Upload status overlay */}
                {isUploading && (
                  <View style={styles.uploadOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.uploadOverlayText}>Uploading…</Text>
                  </View>
                )}

                {/* Status badge */}
                {!isUploading && (
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: photoUrl ? '#2E7D32' : '#C62828' },
                  ]}>
                    <Text style={styles.statusBadgeText}>
                      {photoUrl ? '✓ Uploaded' : '✕ Upload failed'}
                    </Text>
                  </View>
                )}

                {/* Retake / retry button */}
                <View style={styles.photoActions}>
                  <TouchableOpacity
                    style={[styles.retakeBtn, { borderColor: GUARD_ACCENT }]}
                    onPress={handleRetakePhoto}
                    disabled={isUploading}
                  >
                    <Text style={{ color: GUARD_ACCENT, fontWeight: '600', fontSize: 13 }}>
                      📷  Retake Photo
                    </Text>
                  </TouchableOpacity>

                  {!photoUrl && !isUploading && (
                    <TouchableOpacity
                      style={[styles.retakeBtn, { borderColor: colors.primary, marginLeft: 8 }]}
                      onPress={() => uploadPhoto(photoUri)}
                    >
                      <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
                        ↺  Retry Upload
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              // Capture prompt
              <TouchableOpacity
                style={styles.capturePrompt}
                onPress={handleCapturePhoto}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 40 }}>📷</Text>
                <Text
                  variant="titleMedium"
                  style={{ color: GUARD_ACCENT, fontWeight: '700', marginTop: 8 }}
                >
                  Capture Visitor Photo
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }}
                >
                  Tap to open camera. Photo is mandatory.
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Photo error message */}
          {!!photoError && (
            <Text variant="bodySmall" style={[styles.photoErrorText, { color: colors.error }]}>
              {photoError}
            </Text>
          )}

          {/* ── Resident Search ── */}
          <Text variant="titleSmall" style={[styles.sectionLabel, { color: colors.onSurfaceVariant, marginTop: 12 }]}>
            Search Resident
          </Text>

          <View>
            <AppInput
              label="Flat Number *"
              value={flatSearch}
              onChangeText={handleFlatChange}
              error={errors.flatNumber?.message || errors.residentId?.message}
              left="home-outline"
              autoCapitalize="characters"
              returnKeyType="next"
            />

            {showDropdown && (
              <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
                {isSearching ? (
                  <View style={styles.dropdownRow}>
                    <ActivityIndicator size="small" color={GUARD_ACCENT} />
                    <Text style={{ marginLeft: 8, color: colors.onSurfaceVariant }}>Searching…</Text>
                  </View>
                ) : residents.length === 0 ? (
                  <View style={styles.dropdownRow}>
                    <Text style={{ color: colors.onSurfaceVariant }}>No residents found for "{debouncedFlat}"</Text>
                  </View>
                ) : (
                  residents.map((r, idx) => (
                    <React.Fragment key={r._id}>
                      <TouchableOpacity
                        style={styles.dropdownRow}
                        onPress={() => handleSelectResident(r)}
                      >
                        <Text style={{ fontWeight: '600', color: colors.onSurface }}>
                          {r.flatNumber}
                        </Text>
                        <Text style={{ color: colors.onSurfaceVariant, marginLeft: 8 }}>
                          {r.firstName} {r.lastName}
                        </Text>
                      </TouchableOpacity>
                      {idx < residents.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                )}
              </View>
            )}
          </View>

          {selectedResident && (
            <View style={[styles.residentChip, { backgroundColor: GUARD_ACCENT + '15', borderColor: GUARD_ACCENT }]}>
              <Text style={{ color: GUARD_ACCENT, fontWeight: '600', flex: 1 }}>
                ✓ {selectedResident.firstName} {selectedResident.lastName} — Flat {selectedResident.flatNumber}
              </Text>
              <TouchableOpacity onPress={clearResident}>
                <Text style={{ color: GUARD_ACCENT, marginLeft: 8, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Visitor Info ── */}
          <Text variant="titleSmall" style={[styles.sectionLabel, { color: colors.onSurfaceVariant, marginTop: 12 }]}>
            Visitor Information
          </Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Visitor Name *"
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
                left="account-outline"
                autoCapitalize="words"
                returnKeyType="next"
              />
            )}
          />

          <Controller
            control={control}
            name="mobile"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Mobile Number *"
                value={value}
                onChangeText={onChange}
                error={errors.mobile?.message}
                left="call-outline"
                keyboardType="phone-pad"
                maxLength={10}
                returnKeyType="next"
              />
            )}
          />

          <Controller
            control={control}
            name="purpose"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Purpose of Visit *"
                value={value}
                onChangeText={onChange}
                error={errors.purpose?.message}
                left="briefcase-outline"
                autoCapitalize="sentences"
                returnKeyType="done"
                multiline
                numberOfLines={2}
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            )}
          />

          <AppButton
            label={isUploading ? 'Uploading Photo…' : 'Log Visitor Entry'}
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
            disabled={isSubmitDisabled}
            color={GUARD_ACCENT}
            icon="account-plus-outline"
            size="large"
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, gap: 10 },
  banner: { borderRadius: 12, padding: 14, marginBottom: 6 },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  submitBtn: { marginTop: 12, borderRadius: 12 },

  // Photo section
  photoSection: {
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 180,
  },
  capturePrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 180,
  },
  previewContainer: {
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 240,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadOverlayText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  photoActions: {
    flexDirection: 'row',
    padding: 10,
  },
  retakeBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  photoErrorText: {
    marginTop: -4,
    marginLeft: 4,
    marginBottom: 2,
  },

  // Resident search
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: -4,
    marginBottom: 4,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  residentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 2,
  },
});