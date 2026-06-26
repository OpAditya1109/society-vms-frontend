// src/screens/resident/MarketplaceScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, RefreshControl,
  Image, ActivityIndicator,
} from 'react-native';
import {
  Text, useTheme, Appbar, Modal, Portal, Divider,
  SegmentedButtons, Menu, IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

import { useListings, useMyListings, useCreateListing, useDeleteListing, useUpdateListing } from '../../hooks/useListings';
import ListingCard from '../../components/resident/ListingCard';
import { AppButton, AppInput, EmptyState, ErrorState } from '../../components/common';
import { SkeletonList } from '../../components/resident/SkeletonCard';
import { listingService } from '../../api/services/listingService';

// ── Constants ─────────────────────────────────────────────────────────────────
const LISTING_TYPES = [
  { value: 'flat_rent', label: 'Flat Rent',  icon: 'home' },
  { value: 'flat_sale', label: 'Flat Sale',  icon: 'home-outline' },
  { value: 'furniture', label: 'Furniture',  icon: 'bed-outline' },
  { value: 'vehicle',   label: 'Vehicle',    icon: 'car-outline' },
  { value: 'appliance', label: 'Appliance',  icon: 'tv-outline' },
  { value: 'other',     label: 'Other',      icon: 'pricetag-outline' },
];

const TYPE_FILTERS = [{ value: '', label: 'All' }, ...LISTING_TYPES];

const BHK_TYPES  = ['1BHK', '2BHK', '3BHK', '4BHK', 'Studio', 'Penthouse'];
const FURNISHING = ['unfurnished', 'semi-furnished', 'fully-furnished'];

// ── Zod schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  title:        z.string().trim().min(5, 'At least 5 characters').max(150),
  description:  z.string().trim().min(10, 'At least 10 characters').max(2000),
  type:         z.string().min(1, 'Select a category'),
  price:        z.string().min(1, 'Enter a price (0 for free)'),
  priceLabel:   z.string().trim().max(30).optional(),
  isNegotiable: z.boolean().optional(),
  contactName:  z.string().trim().max(80).optional(),
  contactMobile:z.string().trim().optional(),
});

export default function MarketplaceScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [tab,         setTab]         = useState('browse');   // browse | mine
  const [typeFilter,  setTypeFilter]  = useState('');
  const [filterMenu,  setFilterMenu]  = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  // Queries
  const {
    data: browseData, isLoading: browseLoading, isError: browseError,
    error: browseErr, refetch: refetchBrowse,
  } = useListings({ type: typeFilter || undefined, limit: 50 });

  const {
    data: myData, isLoading: myLoading, isError: myError,
    error: myErr, refetch: refetchMine,
  } = useMyListings();

  const createMutation = useCreateListing();
  const deleteMutation = useDeleteListing();

  const listings   = browseData?.data ?? [];
  const myListings = myData?.data     ?? [];

  // Form
  const {
    control, handleSubmit, reset, watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', description: '', type: '', price: '',
      priceLabel: '', isNegotiable: false, contactName: '', contactMobile: '',
    },
  });

  const watchType = watch('type');
  const isFlatType = watchType === 'flat_rent' || watchType === 'flat_sale';

  // Flat-specific extra state (outside zod for simplicity)
  const [bhkType,    setBhkType]    = useState('');
  const [furnishing, setFurnishing] = useState('');
  const [parking,    setParking]    = useState(false);

  // ── Multi-image state (up to 5) ────────────────────────────────────────────
  // Each entry: { uri (local preview), url (Cloudinary), uploading, error }
  const MAX_IMAGES = 5;
  const [images, setImages] = useState([]);

  const handlePickListingImage = async () => {
    if (images.length >= MAX_IMAGES) {
      Toast.show({ type: 'info', text1: 'Limit reached', text2: `You can add up to ${MAX_IMAGES} photos.` });
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission Required', text2: 'Enable photo library access in Settings.' });
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: false,
        quality: 0.75,
      });
      if (result.canceled) return;

      const uri = result.assets[0].uri;
      const idx = images.length;
      setImages((prev) => [...prev, { uri, url: null, uploading: true, error: null }]);

      try {
        const response = await listingService.uploadListingPhoto(uri);
        if (response?.success && response?.data?.photoUrl) {
          setImages((prev) =>
            prev.map((img, i) => i === idx ? { ...img, url: response.data.photoUrl, uploading: false } : img)
          );
        } else {
          throw new Error('Unexpected response from server.');
        }
      } catch (err) {
        const msg = err?.response?.data?.message ?? err?.message ?? 'Upload failed.';
        setImages((prev) =>
          prev.map((img, i) => i === idx ? { ...img, uploading: false, error: msg } : img)
        );
        Toast.show({ type: 'error', text1: 'Upload Failed', text2: msg });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to open gallery. Please try again.' });
    }
  };

  const handleRemoveListingImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRetryListingImage = async (idx) => {
    const img = images[idx];
    if (!img) return;
    setImages((prev) => prev.map((m, i) => i === idx ? { ...m, uploading: true, error: null } : m));
    try {
      const response = await listingService.uploadListingPhoto(img.uri);
      if (response?.success && response?.data?.photoUrl) {
        setImages((prev) => prev.map((m, i) => i === idx ? { ...m, url: response.data.photoUrl, uploading: false } : m));
      } else throw new Error('Unexpected response.');
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Upload failed.';
      setImages((prev) => prev.map((m, i) => i === idx ? { ...m, uploading: false, error: msg } : m));
      Toast.show({ type: 'error', text1: 'Retry Failed', text2: msg });
    }
  };

  const resetImageState = () => setImages([]);

  const onSubmit = (values) => {
    const uploadedImages = images.filter((img) => img.url).map((img) => img.url);
    const anyUploading   = images.some((img) => img.uploading);

    if (anyUploading) {
      Toast.show({ type: 'info', text1: 'Please wait', text2: 'Images are still uploading…' });
      return;
    }

    const payload = {
      ...values,
      price: parseFloat(values.price) || 0,
      ...(uploadedImages.length > 0 && { images: uploadedImages }),
    };
    if (isFlatType) {
      payload.flatDetails = {
        bhkType:    bhkType    || undefined,
        furnishing: furnishing || undefined,
        parking,
      };
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        reset();
        setBhkType('');
        setFurnishing('');
        setParking(false);
        resetImageState();
        setShowForm(false);
        setTab('mine');
      },
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchBrowse(), refetchMine()]);
    setRefreshing(false);
  }, [refetchBrowse, refetchMine]);

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  // ── Render listing item ─────────────────────────────────────────────────────
  const renderBrowseItem = ({ item }) => (
    <ListingCard
      listing={item}
      onPress={() => navigation.navigate('ListingDetail', { id: item._id })}
      style={styles.gridItem}
    />
  );

  const renderMyItem = ({ item }) => (
    <View style={styles.gridItem}>
      <ListingCard
        listing={item}
        onPress={() => navigation.navigate('ListingDetail', { id: item._id })}
      />
      {/* Quick status + delete row */}
      <View style={[styles.myItemActions, { borderColor: colors.outlineVariant, backgroundColor: colors.surface }]}>
        <StatusQuickChange listingId={item._id} currentStatus={item.status} colors={colors} />
        <IconButton
          icon="trash-can-outline"
          iconColor={colors.error}
          size={20}
          onPress={() => handleDelete(item._id)}
          disabled={deleteMutation.isPending}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['bottom']}>
      {/* Appbar */}
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.Content title="Marketplace" titleStyle={{ fontWeight: '700' }} />
        <Menu
          visible={filterMenu}
          onDismiss={() => setFilterMenu(false)}
          anchor={
            <Appbar.Action
              icon="filter-variant"
              color={typeFilter ? colors.primary : colors.onSurface}
              onPress={() => setFilterMenu(true)}
            />
          }
        >
          {TYPE_FILTERS.map((f) => (
            <Menu.Item
              key={f.value}
              title={f.label}
              leadingIcon={typeFilter === f.value ? 'check' : undefined}
              onPress={() => { setTypeFilter(f.value); setFilterMenu(false); }}
            />
          ))}
        </Menu>
        <Appbar.Action icon="plus" onPress={() => setShowForm(true)} />
      </Appbar.Header>

      {/* Tabs */}
      <View style={styles.segmentWrap}>
        <SegmentedButtons
          value={tab}
          onValueChange={setTab}
          buttons={[
            { value: 'browse', label: 'All Listings',  icon: 'store-outline' },
            { value: 'mine',   label: 'My Listings',   icon: 'account-circle-outline' },
          ]}
        />
      </View>

      {/* Browse tab */}
      {tab === 'browse' && (
        browseError ? (
          <ErrorState error={browseErr?.response?.data?.message ?? 'Failed to load listings'} onRetry={refetchBrowse} />
        ) : browseLoading ? (
          <View style={{ paddingTop: 16 }}><SkeletonList count={4} /></View>
        ) : (
          <FlatList
            key="browse-grid-2"
            data={listings}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListHeaderComponent={
              typeFilter ? (
                <View style={[styles.filterBanner, { backgroundColor: colors.primaryContainer }]}>
                  <Text variant="bodySmall" style={{ color: colors.onPrimaryContainer }}>
                    Filtering: {LISTING_TYPES.find((t) => t.value === typeFilter)?.label}
                  </Text>
                  <TouchableOpacity onPress={() => setTypeFilter('')}>
                    <Ionicons name="close-circle" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                icon="store-outline"
                title="No listings yet"
                subtitle="Be the first to post — tap the + button."
              />
            }
            renderItem={renderBrowseItem}
          />
        )
      )}

      {/* My listings tab */}
      {tab === 'mine' && (
        myError ? (
          <ErrorState error={myErr?.response?.data?.message ?? 'Failed to load'} onRetry={refetchMine} />
        ) : myLoading ? (
          <View style={{ paddingTop: 16 }}><SkeletonList count={3} /></View>
        ) : (
          <FlatList
            key="mine-grid-2"
            data={myListings}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <EmptyState
                icon="plus-box-outline"
                title="You have no listings"
                subtitle="Tap + to post a flat, furniture, or vehicle."
              />
            }
            renderItem={renderMyItem}
          />
        )
      )}

      {/* Create Listing Modal */}
      <Portal>
        <Modal
          visible={showForm}
          onDismiss={() => {
            if (!createMutation.isPending) {
              setShowForm(false);
              reset();
              resetImageState();
            }
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text variant="titleMedium" style={[styles.modalTitle, { color: colors.onSurface }]}>
                Post a New Listing
              </Text>
              <Divider style={{ marginBottom: 16 }} />
              <ListingForm
                control={control}
                errors={errors}
                watch={watch}
                onSubmit={handleSubmit(onSubmit)}
                loading={createMutation.isPending}
                colors={colors}
                isFlatType={isFlatType}
                bhkType={bhkType}    setBhkType={setBhkType}
                furnishing={furnishing} setFurnishing={setFurnishing}
                parking={parking}    setParking={setParking}
                onCancel={() => { reset(); resetImageState(); setShowForm(false); }}
                images={images}
                onPickImage={handlePickListingImage}
                onRemoveImage={handleRemoveListingImage}
                onRetryImage={handleRetryListingImage}
                maxImages={MAX_IMAGES}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

// ── Status quick-change for "My Listings" row ─────────────────────────────────
function StatusQuickChange({ listingId, currentStatus, colors }) {
  const [open, setOpen] = useState(false);
  const updateMutation  = useUpdateListing(listingId);

  const STATUS_OPTIONS = [
    { value: 'active',    label: 'Active',    icon: 'check-circle-outline' },
    { value: 'sold',      label: 'Sold',      icon: 'tag-off-outline' },
    { value: 'rented',    label: 'Rented',    icon: 'home-lock-outline' },
    { value: 'withdrawn', label: 'Withdrawn', icon: 'close-circle-outline' },
  ];

  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchor={
        <TouchableOpacity
          style={[styles.statusBtn, { borderColor: colors.outlineVariant }]}
          onPress={() => setOpen(true)}
        >
          <Text variant="bodySmall" style={{ color: colors.primary, fontWeight: '600' }}>
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)} ▾
          </Text>
        </TouchableOpacity>
      }
    >
      {STATUS_OPTIONS.map((s) => (
        <Menu.Item
          key={s.value}
          title={s.label}
          leadingIcon={currentStatus === s.value ? 'check' : s.icon}
          onPress={() => { updateMutation.mutate({ status: s.value }); setOpen(false); }}
        />
      ))}
    </Menu>
  );
}

// ── Listing Form ──────────────────────────────────────────────────────────────
function ListingForm({
  control, errors, watch, onSubmit, loading, colors, onCancel,
  isFlatType, bhkType, setBhkType, furnishing, setFurnishing, parking, setParking,
  images, onPickImage, onRemoveImage, onRetryImage, maxImages,
}) {
  const watchType = watch('type');

  return (
    <View style={{ gap: 14 }}>
      {/* Category selector */}
      <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>Category *</Text>
      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => (
          <View style={styles.typeGrid}>
            {LISTING_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: value === t.value ? colors.primary + '18' : colors.surfaceVariant,
                    borderColor:     value === t.value ? colors.primary        : colors.outlineVariant,
                  },
                ]}
                onPress={() => onChange(t.value)}
                activeOpacity={0.7}
              >
                <Ionicons name={t.icon} size={14} color={value === t.value ? colors.primary : colors.onSurfaceVariant} />
                <Text
                  variant="labelSmall"
                  style={{ color: value === t.value ? colors.primary : colors.onSurfaceVariant, marginLeft: 4 }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
      {errors.type && <Text variant="bodySmall" style={{ color: colors.error }}>{errors.type.message}</Text>}

      {/* Title */}
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value } }) => (
          <AppInput
            label="Title *"
            value={value}
            onChangeText={onChange}
            error={errors.title?.message}
            placeholder="e.g. 2BHK for rent, Sofa set for sale…"
          />
        )}
      />

      {/* Description */}
      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <AppInput
            label="Description *"
            value={value}
            onChangeText={onChange}
            multiline
            numberOfLines={4}
            error={errors.description?.message}
            placeholder="Share details, condition, reason for selling…"
          />
        )}
      />

      {/* Price row */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1.2 }}>
          <Controller
            control={control}
            name="price"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Price (₹) *"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                error={errors.price?.message}
                placeholder="0 for free"
              />
            )}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="priceLabel"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Label"
                value={value}
                onChangeText={onChange}
                placeholder="per month"
              />
            )}
          />
        </View>
      </View>

      {/* Negotiable toggle */}
      <Controller
        control={control}
        name="isNegotiable"
        render={({ field: { onChange, value } }) => (
          <TouchableOpacity
            style={[
              styles.toggleRow,
              { backgroundColor: value ? colors.primary + '10' : colors.surfaceVariant, borderColor: colors.outlineVariant },
            ]}
            onPress={() => onChange(!value)}
          >
            <Ionicons
              name={value ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={value ? colors.primary : colors.onSurfaceVariant}
            />
            <Text variant="bodyMedium" style={{ marginLeft: 8, color: value ? colors.primary : colors.onSurfaceVariant }}>
              Price is negotiable
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Flat-specific fields */}
      {isFlatType && (
        <>
          <Divider />
          <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>Flat Details</Text>

          {/* BHK type */}
          <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>BHK Type</Text>
          <View style={styles.typeGrid}>
            {BHK_TYPES.map((b) => (
              <TouchableOpacity
                key={b}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: bhkType === b ? colors.secondary + '18' : colors.surfaceVariant,
                    borderColor:     bhkType === b ? colors.secondary        : colors.outlineVariant,
                  },
                ]}
                onPress={() => setBhkType(bhkType === b ? '' : b)}
              >
                <Text variant="labelSmall" style={{ color: bhkType === b ? colors.secondary : colors.onSurfaceVariant }}>
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Furnishing */}
          <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>Furnishing</Text>
          <View style={styles.typeGrid}>
            {FURNISHING.map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: furnishing === f ? colors.secondary + '18' : colors.surfaceVariant,
                    borderColor:     furnishing === f ? colors.secondary        : colors.outlineVariant,
                  },
                ]}
                onPress={() => setFurnishing(furnishing === f ? '' : f)}
              >
                <Text
                  variant="labelSmall"
                  style={{ color: furnishing === f ? colors.secondary : colors.onSurfaceVariant }}
                >
                  {f.replace('-', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Parking */}
          <TouchableOpacity
            style={[
              styles.toggleRow,
              { backgroundColor: parking ? colors.secondary + '10' : colors.surfaceVariant, borderColor: colors.outlineVariant },
            ]}
            onPress={() => setParking(!parking)}
          >
            <Ionicons
              name={parking ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={parking ? colors.secondary : colors.onSurfaceVariant}
            />
            <Text variant="bodyMedium" style={{ marginLeft: 8, color: parking ? colors.secondary : colors.onSurfaceVariant }}>
              Parking included
            </Text>
          </TouchableOpacity>
          <Divider />
        </>
      )}

      {/* Photos (up to 5) */}
      <View>
        <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant, marginBottom: 8 }}>
          Photos (optional, up to {maxImages})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            {images.map((img, idx) => (
              <View key={idx} style={styles.thumbWrap}>
                <Image source={{ uri: img.uri }} style={styles.thumb} resizeMode="cover" />

                {/* Uploading overlay */}
                {img.uploading && (
                  <View style={styles.thumbOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}

                {/* Error overlay */}
                {img.error && !img.uploading && (
                  <View style={styles.thumbOverlay}>
                    <TouchableOpacity onPress={() => onRetryImage(idx)} style={styles.retryIconBtn}>
                      <Ionicons name="refresh" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Remove button */}
                {!img.uploading && (
                  <TouchableOpacity style={styles.thumbRemoveBtn} onPress={() => onRemoveImage(idx)}>
                    <Ionicons name="close" size={13} color="#fff" />
                  </TouchableOpacity>
                )}

                {/* Uploaded tick */}
                {img.url && !img.uploading && (
                  <View style={styles.thumbTick}>
                    <Ionicons name="checkmark" size={11} color="#fff" />
                  </View>
                )}
              </View>
            ))}

            {/* Add button */}
            {images.length < maxImages && (
              <TouchableOpacity
                style={[styles.addThumbBtn, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceVariant }]}
                onPress={onPickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={22} color={colors.onSurfaceVariant} />
                <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, marginTop: 4 }}>
                  {images.length === 0 ? 'Add photo' : `${images.length}/${maxImages}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Error summary */}
        {images.some((img) => img.error) && (
          <Text variant="bodySmall" style={{ color: colors.error, marginTop: 2 }}>
            Some images failed to upload. Tap the refresh icon to retry.
          </Text>
        )}
      </View>

      {/* Contact info */}
      <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>Contact (optional — defaults to your profile)</Text>
      <Controller
        control={control}
        name="contactName"
        render={({ field: { onChange, value } }) => (
          <AppInput label="Contact Name" value={value} onChangeText={onChange} placeholder="Your name" />
        )}
      />
      <Controller
        control={control}
        name="contactMobile"
        render={({ field: { onChange, value } }) => (
          <AppInput
            label="Contact Mobile"
            value={value}
            onChangeText={onChange}
            keyboardType="phone-pad"
            placeholder="10-digit mobile number"
            error={errors.contactMobile?.message}
          />
        )}
      />

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
        {onCancel && (
          <AppButton label="Cancel" mode="outlined" onPress={onCancel} style={{ flex: 1 }} disabled={loading} />
        )}
        <AppButton label="Post Listing" onPress={onSubmit} loading={loading} style={{ flex: 2 }} />
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:       { flex: 1 },
  segmentWrap:  { paddingHorizontal: 16, paddingVertical: 12 },
  list:         { padding: 12, paddingBottom: 32, flexGrow: 1 },
  row:          { gap: 10, marginBottom: 10 },
  gridItem:     { flex: 1 },
  filterBanner: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 8, borderRadius: 8, marginBottom: 10,
  },
  modal: {
    margin: 16, borderRadius: 20, padding: 20, maxHeight: '92%',
  },
  modalTitle: { fontWeight: '700', marginBottom: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  myItemActions: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8, borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
  },
  statusBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
  },

  // Multi-image thumbnail strip
  thumbWrap:      { width: 90, height: 90, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  thumb:          { width: 90, height: 90, backgroundColor: '#eee' },
  thumbOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  thumbRemoveBtn: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  thumbTick:      { position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  retryIconBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  addThumbBtn:    { width: 90, height: 90, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
});