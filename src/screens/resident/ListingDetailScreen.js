// src/screens/resident/ListingDetailScreen.js
import React from 'react';
import { View, ScrollView, StyleSheet, Linking, TouchableOpacity, Alert } from 'react-native';
import { Text, useTheme, Appbar, Divider, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { useListing, useToggleInterest, useDeleteListing } from '../../hooks/useListings';
import { AppButton, ErrorState } from '../../components/common';

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
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
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
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
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
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Listing Detail" titleStyle={{ fontWeight: '700' }} />
        {isOwner && (
          <Appbar.Action icon="trash-can-outline" color={colors.error} onPress={handleDelete} />
        )}
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>
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
            <View style={styles.chipsRow}>
              {listing.flatDetails.bhkType    && <Chip compact icon="home"      style={styles.chip}>{listing.flatDetails.bhkType}</Chip>}
              {listing.flatDetails.furnishing && <Chip compact icon="sofa"      style={styles.chip}>{listing.flatDetails.furnishing}</Chip>}
              {listing.flatDetails.parking    && <Chip compact icon="car"       style={styles.chip}>Parking</Chip>}
              {listing.flatNumber             && <Chip compact icon="door-open" style={styles.chip}>Flat {listing.flatNumber}</Chip>}
            </View>
            {listing.flatDetails.wing && (
              <InfoRow icon="layers-outline" label="Wing" value={listing.flatDetails.wing} colors={colors} />
            )}
            {listing.flatDetails.floor != null && (
              <InfoRow icon="trending-up-outline" label="Floor" value={`${listing.flatDetails.floor}`} colors={colors} />
            )}
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
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },

  typeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 12,
  },
  typeText: { fontWeight: '700', fontSize: 14, flex: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '800' },

  card: { borderRadius: 14, padding: 16 },
  title: { fontWeight: '700', marginBottom: 6, lineHeight: 36 },
  price: { fontSize: 26, fontWeight: '800' },
  sectionTitle: { fontWeight: '700', marginBottom: 12 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { height: 26 },

  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#0001',
  },

  statsRow: {
    flexDirection: 'row', borderRadius: 14,
    paddingVertical: 12,
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