// src/screens/admin/AmenityManagementScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Modal, ScrollView,
} from 'react-native';
import { Text, useTheme, Appbar, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { useAmenities } from '../../hooks/useAmenities';
import { amenityService } from '../../api/services/amenityService';
import { AppInput, AppButton, EmptyState, ErrorState } from '../../components/common';
import { SkeletonList } from '../../components/resident/SkeletonCard';

const ADMIN_ACCENT = '#4A148C';

const AMENITY_TYPES = [
  { value: 'clubhouse', label: 'Clubhouse',  icon: 'business-outline',   color: '#9C27B0' },
  { value: 'gym',       label: 'Gym',         icon: 'barbell-outline',    color: '#E65100' },
  { value: 'pool',      label: 'Pool',         icon: 'water-outline',     color: '#1565C0' },
  { value: 'tennis',    label: 'Tennis',       icon: 'tennisball-outline', color: '#2E7D32' },
  { value: 'badminton', label: 'Badminton',    icon: 'fitness-outline',   color: '#00897B' },
  { value: 'garden',    label: 'Garden',       icon: 'leaf-outline',      color: '#558B2F' },
  { value: 'parking',   label: 'Parking',      icon: 'car-outline',       color: '#546E7A' },
  { value: 'other',     label: 'Other',        icon: 'apps-outline',      color: '#607D8B' },
];

const getMeta = (type) => AMENITY_TYPES.find(t => t.value === type) ?? AMENITY_TYPES[7];

function AmenityCard({ amenity }) {
  const meta = getMeta(amenity.type);
  return (
    <Surface style={styles.card} elevation={2}>
      <View style={[styles.cardIcon, { backgroundColor: meta.color + '15' }]}>
        <Ionicons name={meta.icon} size={24} color={meta.color} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{amenity.name}</Text>
        <Text style={styles.cardSub}>{meta.label} · {amenity.openTime}–{amenity.closeTime}</Text>
        <Text style={styles.cardSub}>{amenity.slotDurationMinutes} min slots · Capacity: {amenity.capacity}</Text>
      </View>
      <View style={[styles.activeBadge, { backgroundColor: amenity.isActive ? '#E8F5E9' : '#FFEBEE' }]}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: amenity.isActive ? '#2E7D32' : '#C62828' }}>
          {amenity.isActive ? 'Active' : 'Inactive'}
        </Text>
      </View>
    </Surface>
  );
}

function CreateAmenityModal({ visible, onClose }) {
  const [name, setName]               = useState('');
  const [type, setType]               = useState('clubhouse');
  const [openTime, setOpenTime]       = useState('06:00');
  const [closeTime, setCloseTime]     = useState('22:00');
  const [slotDuration, setSlotDuration] = useState('60');
  const [capacity, setCapacity]       = useState('10');
  const [description, setDescription] = useState('');
  const [errors, setErrors]           = useState({});

  const qc = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (payload) => amenityService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amenities'] });
      Toast.show({ type: 'success', text1: 'Amenity Created!', text2: `${name} is now available for residents to book.` });
      resetForm();
      onClose();
    },
    onError: (e) => {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.message ?? 'Failed to create amenity.' });
    },
  });

  const resetForm = () => {
    setName(''); setType('clubhouse'); setOpenTime('06:00');
    setCloseTime('22:00'); setSlotDuration('60'); setCapacity('10');
    setDescription(''); setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!name.trim() || name.trim().length < 3) e.name = 'Name must be at least 3 characters';
    const timeRe = /^\d{2}:\d{2}$/;
    if (!timeRe.test(openTime))  e.openTime  = 'Use HH:MM format (e.g. 06:00)';
    if (!timeRe.test(closeTime)) e.closeTime = 'Use HH:MM format (e.g. 22:00)';
    const dur = parseInt(slotDuration, 10);
    if (isNaN(dur) || dur < 15 || dur > 240) e.slotDuration = '15–240 minutes';
    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap < 1) e.capacity = 'At least 1';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createMutation.mutate({
      name: name.trim(),
      type,
      openTime,
      closeTime,
      slotDurationMinutes: parseInt(slotDuration, 10),
      capacity: parseInt(capacity, 10),
      description: description.trim(),
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Add New Amenity</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

            <Text style={modalStyles.label}>Amenity Name *</Text>
            <AppInput
              placeholder="e.g. Olympic Swimming Pool"
              value={name}
              onChangeText={setName}
              error={errors.name}
            />

            <Text style={modalStyles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {AMENITY_TYPES.map(t => (
                <TouchableOpacity
                  key={t.value}
                  style={[modalStyles.typeChip, type === t.value && { backgroundColor: ADMIN_ACCENT, borderColor: ADMIN_ACCENT }]}
                  onPress={() => setType(t.value)}
                >
                  <Ionicons name={t.icon} size={16} color={type === t.value ? '#fff' : '#555'} />
                  <Text style={[modalStyles.typeChipText, type === t.value && { color: '#fff' }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.label}>Opens (HH:MM) *</Text>
                <AppInput placeholder="06:00" value={openTime} onChangeText={setOpenTime} error={errors.openTime} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.label}>Closes (HH:MM) *</Text>
                <AppInput placeholder="22:00" value={closeTime} onChangeText={setCloseTime} error={errors.closeTime} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.label}>Slot Duration (min) *</Text>
                <AppInput placeholder="60" value={slotDuration} onChangeText={setSlotDuration} keyboardType="numeric" error={errors.slotDuration} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.label}>Max Capacity</Text>
                <AppInput placeholder="10" value={capacity} onChangeText={setCapacity} keyboardType="numeric" error={errors.capacity} />
              </View>
            </View>

            <Text style={modalStyles.label}>Description (optional)</Text>
            <AppInput
              placeholder="Brief description of this amenity..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

         <TouchableOpacity
  style={[modalStyles.submitBtn, createMutation.isPending && { opacity: 0.6 }]}
  onPress={handleSubmit}
  disabled={createMutation.isPending}
  activeOpacity={0.85}
>
  <Text style={modalStyles.submitBtnText}>
    {createMutation.isPending ? 'Creating...' : 'Create Amenity'}
  </Text>
</TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function AmenityManagementScreen() {
  const { colors } = useTheme();
  const [createVisible, setCreateVisible] = useState(false);

  const { data, isLoading, isError, error, refetch, isRefetching } = useAmenities();
  const amenities = data?.data ?? [];

  const onRefresh = useCallback(() => refetch(), [refetch]);

  if (isError) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <Appbar.Header style={styles.appbar}>
          <Appbar.Content title="Amenities" titleStyle={styles.appbarTitle} />
        </Appbar.Header>
        <ErrorState error={error?.response?.data?.message ?? 'Failed to load amenities'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="Amenities" titleStyle={styles.appbarTitle} />
        <Appbar.Action icon="plus-circle" color={ADMIN_ACCENT} size={28} onPress={() => setCreateVisible(true)} />
      </Appbar.Header>

      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={16} color={ADMIN_ACCENT} />
        <Text style={styles.infoText}>Amenities added here are available for residents to book.</Text>
      </View>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : (
        <FlatList
          data={amenities}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <AmenityCard amenity={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[ADMIN_ACCENT]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="business-outline"
              title="No amenities yet"
              subtitle="Tap the + button to add your first amenity for residents to book."
            />
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setCreateVisible(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <CreateAmenityModal visible={createVisible} onClose={() => setCreateVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F3FF' },
  appbar: { backgroundColor: '#fff', elevation: 0, borderBottomWidth: 1, borderBottomColor: '#EDE7F6' },
  appbarTitle: { fontWeight: '800', fontSize: 20, color: ADMIN_ACCENT },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EDE7F6', marginHorizontal: 16, marginTop: 12,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  infoText: { fontSize: 12, color: ADMIN_ACCENT, flex: 1, fontWeight: '500' },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
  },
  cardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  cardSub: { fontSize: 12, color: '#757575' },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: ADMIN_ACCENT, alignItems: 'center', justifyContent: 'center',
    elevation: 6,
  },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingBottom: 20, maxHeight: '92%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6, marginTop: 12 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA', marginRight: 8,
  },
  typeChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  submitBtn: {
  backgroundColor: ADMIN_ACCENT,
  paddingVertical: 15,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 16,
},
submitBtnText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '700',
},
});