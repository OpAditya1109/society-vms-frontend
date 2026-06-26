// src/components/resident/ListingCard.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const TYPE_CONFIG = {
  flat_rent:  { label: 'Flat for Rent',  icon: 'home',             color: '#1565C0' },
  flat_sale:  { label: 'Flat for Sale',  icon: 'home-outline',     color: '#4A148C' },
  furniture:  { label: 'Furniture',      icon: 'bed-outline',      color: '#E65100' },
  vehicle:    { label: 'Vehicle',        icon: 'car-outline',      color: '#00838F' },
  appliance:  { label: 'Appliance',      icon: 'tv-outline',       color: '#2E7D32' },
  other:      { label: 'Other',          icon: 'pricetag-outline', color: '#757575' },
};

const STATUS_COLORS = {
  active:    '#2E7D32',
  sold:      '#C62828',
  rented:    '#1565C0',
  withdrawn: '#757575',
};

export default function ListingCard({ listing, onPress, style, compact = false }) {
  const { colors } = useTheme();
  const cfg = TYPE_CONFIG[listing.type] ?? TYPE_CONFIG.other;
  const poster = listing.postedBy;

  const priceDisplay = listing.price === 0
    ? 'Free'
    : `₹ ${listing.price.toLocaleString('en-IN')}`;

  const hasImage = listing.images?.length > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={[styles.card, { backgroundColor: colors.surface }, style]}
    >
      {/* ── Image area ── */}
      <View style={styles.imageWrap}>
        {hasImage ? (
          <Image
            source={{ uri: listing.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          /* Placeholder when no image */
          <View style={[styles.imagePlaceholder, { backgroundColor: cfg.color + '15' }]}>
            <Ionicons name={cfg.icon} size={36} color={cfg.color + '80'} />
          </View>
        )}

        {/* Price badge — bottom-left overlay */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{priceDisplay}</Text>
        </View>

        {/* Multi-image count — bottom-right */}
        {listing.images?.length > 1 && (
          <View style={styles.imageCountBadge}>
            <Ionicons name="images-outline" size={11} color="#fff" />
            <Text style={styles.imageCountText}>{listing.images.length}</Text>
          </View>
        )}

        {/* Non-active status pill — top-right */}
        {listing.status !== 'active' && (
          <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[listing.status] }]}>
            <Text style={styles.statusText}>{listing.status.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* ── Text content ── */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={[styles.society, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
          {poster
            ? `${poster.firstName} ${poster.lastName}${poster.flatNumber ? ` · Flat ${poster.flatNumber}` : ''}`
            : 'Society Member'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  // Image
  imageWrap:        { position: 'relative', width: '100%', aspectRatio: 1 },
  image:            { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },

  // Overlays
  priceBadge: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  priceText:        { color: '#fff', fontWeight: '700', fontSize: 13 },

  imageCountBadge: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
  },
  imageCountText:   { color: '#fff', fontSize: 10, fontWeight: '700' },

  statusPill: {
    position: 'absolute', top: 8, right: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  statusText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Text
  content:  { padding: 10, paddingTop: 8 },
  title:    { fontSize: 13, fontWeight: '700', marginBottom: 3, lineHeight: 18 },
  society:  { fontSize: 11, lineHeight: 15 },
});