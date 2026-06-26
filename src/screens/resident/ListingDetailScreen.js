// src/screens/resident/ListingDetailScreen.js
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Linking, TouchableOpacity, Alert, Image, FlatList, Dimensions } from 'react-native';
import { Text, useTheme, Appbar, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { useListing, useToggleInterest, useDeleteListing } from '../../hooks/useListings';
import { AppButton, ErrorState } from '../../components/common';

const SCREEN_W = Dimensions.get('window').width;

const TYPE_CONFIG = {
  flat_rent:  { label: 'Flat for Rent',  icon: 'home',             color: '#1565C0' },
  flat_sale:  { label: 'Flat for Sale',  icon: 'home-outline',     color: '#4A148C' },
  furniture:  { label: 'Furniture',      icon: 'bed-outline',      color: '#E65100' },
  vehicle:    { label: 'Vehicle',        icon: 'car-outline',      color: '#00838F' },
  appliance:  { label: 'Appliance',      icon: 'tv-outline',       color: '#2E7D32' },
  other:      { label: 'Other',          icon: 'pricetag-outline', color: '#757575' },
};

export default function ListingDetailScreen() {
  const { colors }   = useTheme();
  const navigation   = useNavigation();
  const route        = useRoute();
  const { id }       = route.params ?? {};

  const { user }     = useSelector((state) => state.auth);

  const { data, isLoading, isError, error, refetch } = useListing(id);
  const interestMutation = useToggleInterest(id);
  const deleteMutation   = useDeleteListing();

  if (isLoading) {
    return (
      <SafeAreaView  style={[styles.screen, { backgroundColor: colors.background }]} edges={["bottom"]}>
        <Appbar.Header style={{ backgroundColor: colors.surface }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Listing Detail" />
        </Appbar.Header>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !data?.data) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={["bottom"]}>
        <Appbar.Header style={{ backgroundColor: colors.surface }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Listing Detail" />
        </Appbar.Header>
        <ErrorState error={error?.response?.data?.message ?? 'Failed to load listing'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const listing = data.data;
  const cfg     = TYPE_CONFIG[listing.type] ?? TYPE_CONFIG.other;
  const poster  = listing.postedBy;
  const isOwner = poster?._id?.toString() === user?._id?.toString();

  const alreadyInterested = listing.interestedBy?.some(
    (u) => u._id?.toString() === user?._id?.toString()
  );

  const priceDisplay = listing.price === 0
    ? 'Free'
    : `₹${listing.price.toLocaleString('en-IN')}${listing.priceLabel ? ` / ${listing.priceLabel}` : ''}`;

  const handleCall = () => {
    const phone = listing.contactMobile || poster?.mobile;
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = () => {
    const phone = listing.contactMobile || poster?.mobile;
    if (phone) Linking.openURL(`https://wa.me/91${phone}?text=Hi, I'm interested in your listing: ${listing.title}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to remove this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteMutation.mutate(listing._id, {
              onSuccess: () => navigation.goBack(),
            }),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Listing Detail" titleStyle={{ fontWeight: '700' }} />
        {isOwner && (
          <Appbar.Action icon="trash-can-outline" color={colors.error} onPress={handleDelete} />
        )}
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Image gallery — full bleed, no side padding ── */}
        {listing.images?.length > 0 && (
          <View style={styles.galleryOuter}>
            <ImageGallery images={listing.images} colors={colors} />
          </View>
        )}

        {/* Type + Status banner */}
        <View style={[styles.typeBanner, { backgroundColor: cfg.color + '12' }]}>
          <Ionicons name={cfg.icon} size={18} color={cfg.color} />
          <Text style={[styles.typeText, { color: cfg.color }]}>{cfg.label}</Text>
          {listing.status !== 'active' && (
            <View style={[styles.statusPill, { backgroundColor: cfg.color + '30' }]}>
              <Text style={[styles.statusText, { color: cfg.color }]}>
                {listing.status.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Title & Price */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text variant="headlineMedium" style={[styles.title, { color: colors.onSurface }]}>
            {listing.title}
          </Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            {priceDisplay}
            {listing.isNegotiable && (
              <Text style={{ fontSize: 14, color: colors.onSurfaceVariant }}> · Negotiable</Text>
            )}
          </Text>
        </View>

        {/* Flat details */}
        {(listing.type === 'flat_rent' || listing.type === 'flat_sale') && listing.flatDetails && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Flat Details
            </Text>
            {/* Quick-glance chips */}
            {(listing.flatDetails.bhkType || listing.flatDetails.furnishing || listing.flatDetails.parking) && (
              <View style={styles.chipsRow}>
                {listing.flatDetails.bhkType && (
                  <View style={[styles.detailChip, { backgroundColor: colors.primaryContainer }]}>
                    <Text style={[styles.detailChipText, { color: colors.primary }]}>{listing.flatDetails.bhkType}</Text>
                  </View>
                )}
                {listing.flatDetails.furnishing && (
                  <View style={[styles.detailChip, { backgroundColor: colors.secondaryContainer }]}>
                    <Text style={[styles.detailChipText, { color: colors.secondary }]}>{listing.flatDetails.furnishing.replace(/-/g, ' ')}</Text>
                  </View>
                )}
                {listing.flatDetails.parking && (
                  <View style={[styles.detailChip, { backgroundColor: '#E8F5E9' }]}>
                    <Ionicons name="car-outline" size={11} color="#2E7D32" />
                    <Text style={[styles.detailChipText, { color: '#2E7D32', marginLeft: 3 }]}>Parking</Text>
                  </View>
                )}
              </View>
            )}
            {/* Labeled info rows */}
            {listing.flatNumber             && <InfoRow icon="door-open-outline"  label="Flat No."       value={`Flat ${listing.flatNumber}`}  colors={colors} />}
            {listing.flatDetails.wing       && <InfoRow icon="layers-outline"     label="Wing"           value={listing.flatDetails.wing}      colors={colors} />}
            {listing.flatDetails.floor != null && <InfoRow icon="trending-up-outline" label="Floor"      value={`${listing.flatDetails.floor}`} colors={colors} />}
            {listing.flatDetails.availableFrom && (
              <InfoRow
                icon="calendar-outline"
                label="Available From"
                value={new Date(listing.flatDetails.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                colors={colors}
              />
            )}
          </View>
        )}

        {/* Description */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Description
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, lineHeight: 22 }}>
            {listing.description}
          </Text>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
          <StatItem icon="eye-outline"   value={listing.views ?? 0}          label="Views"    colors={colors} />
          <StatItem icon="heart-outline" value={listing.interestCount ?? 0}  label="Interested" colors={colors} />
          <StatItem
            icon="time-outline"
            value={new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            label="Posted"
            colors={colors}
          />
        </View>

        {/* Posted by */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Posted By
          </Text>
          <View style={styles.posterInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 18 }}>
                {poster?.firstName?.[0] ?? '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '700' }}>
                {listing.contactName || `${poster?.firstName ?? ''} ${poster?.lastName ?? ''}`}
              </Text>
              {poster?.flatNumber && (
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  Flat {poster.flatNumber}
                </Text>
              )}
            </View>
          </View>

          {/* Contact buttons (visible only if not own listing) */}
          {!isOwner && listing.showContactToAll && (
            <View style={styles.contactBtns}>
              <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#1565C0' }]} onPress={handleCall}>
                <Ionicons name="call" size={16} color="#fff" />
                <Text style={styles.contactBtnText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                <Text style={styles.contactBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Interest button (not for own listings) */}
        {!isOwner && listing.status === 'active' && (
          <AppButton
            label={alreadyInterested ? '❤️  Remove Interest' : '🤍  I\'m Interested'}
            mode={alreadyInterested ? 'contained' : 'outlined'}
            onPress={() => interestMutation.mutate()}
            loading={interestMutation.isPending}
            style={{ marginHorizontal: 0, marginTop: 8 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Image Gallery ─────────────────────────────────────────────────────────────
function ImageGallery({ images, colors }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setActiveIndex(idx);
  };

  return (
    <View style={galleryStyles.wrap}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={[galleryStyles.image, { width: SCREEN_W - 32 }]}
            resizeMode="cover"
          />
        )}
      />
      {/* Dot indicators */}
      {images.length > 1 && (
        <View style={galleryStyles.dotsRow}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[
                galleryStyles.dot,
                { backgroundColor: i === activeIndex ? colors.primary : colors.outlineVariant },
              ]}
            />
          ))}
        </View>
      )}
      {/* Counter badge */}
      {images.length > 1 && (
        <View style={[galleryStyles.counter, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Text style={galleryStyles.counterText}>{activeIndex + 1} / {images.length}</Text>
        </View>
      )}
    </View>
  );
}

const galleryStyles = StyleSheet.create({
  wrap:        { position: 'relative', backgroundColor: '#eee' },
  image:       { width: SCREEN_W, height: 260, backgroundColor: '#eee' },
  dotsRow:     { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8, backgroundColor: 'transparent' },
  dot:         { width: 7, height: 7, borderRadius: 4 },
  counter:     { position: 'absolute', top: 10, right: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

// ── Sub-components ────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, colors }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color={colors.onSurfaceVariant} />
      <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft: 6, flex: 1 }}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
        {value}
      </Text>
    </View>
  );
}

function StatItem({ icon, value, label, colors }) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '700' }}>{value}</Text>
      <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  // No horizontal padding — gallery is full-bleed; inner cards have their own padding
  scroll:      { paddingBottom: 40, gap: 0 },
  galleryOuter:{ marginBottom: 12 },

  typeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, padding: 10, borderRadius: 12,
  },
  typeText: { fontWeight: '700', fontSize: 14, flex: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '800' },

  card: { borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 10 },
  title: { fontWeight: '700', marginBottom: 6, lineHeight: 32 },
  price: { fontSize: 24, fontWeight: '800' },
  sectionTitle: { fontWeight: '700', marginBottom: 10 },

  chipsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  detailChip:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  detailChipText: { fontSize: 12, fontWeight: '600' },

  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#0001',
  },

  statsRow: {
    flexDirection: 'row', borderRadius: 14,
    paddingVertical: 12, marginHorizontal: 16, marginBottom: 10,
  },
  statItem: {
    flex: 1, alignItems: 'center', gap: 2,
  },

  posterInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  contactBtns: { flexDirection: 'row', gap: 10 },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
  },
  contactBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});