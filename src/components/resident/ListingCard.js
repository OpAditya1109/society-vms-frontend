// src/components/resident/ListingCard.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme, Chip, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

/**
 * Type → display config
 */
const TYPE_CONFIG = {
  flat_rent:  { label: 'Flat for Rent',  icon: 'home',           color: '#1565C0' },
  flat_sale:  { label: 'Flat for Sale',  icon: 'home-outline',   color: '#4A148C' },
  furniture:  { label: 'Furniture',      icon: 'bed-outline',    color: '#E65100' },
  vehicle:    { label: 'Vehicle',        icon: 'car-outline',    color: '#00838F' },
  appliance:  { label: 'Appliance',      icon: 'tv-outline',     color: '#2E7D32' },
  other:      { label: 'Other',          icon: 'pricetag-outline', color: '#757575' },
};

const STATUS_COLORS = {
  active:    '#2E7D32',
  sold:      '#C62828',
  rented:    '#1565C0',
  withdrawn: '#757575',
};

export default function ListingCard({ listing, onPress, style }) {
  const { colors } = useTheme();
  const cfg = TYPE_CONFIG[listing.type] ?? TYPE_CONFIG.other;
  const poster = listing.postedBy;

  const priceDisplay = listing.price === 0
    ? 'Free'
    : `₹${listing.price.toLocaleString('en-IN')}${listing.priceLabel ? ` / ${listing.priceLabel}` : ''}`;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Surface style={[styles.card, { backgroundColor: colors.surface }, style]} elevation={1}>
        {/* Top strip: type badge + status */}
        <View style={styles.topRow}>
          <View style={[styles.typeBadge, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '40' }]}>
            <Ionicons name={cfg.icon} size={13} color={cfg.color} style={{ marginRight: 4 }} />
            <Text style={[styles.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          {listing.status !== 'active' && (
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[listing.status] + '20' }]}>
              <Text style={[styles.statusLabel, { color: STATUS_COLORS[listing.status] }]}>
                {listing.status.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text variant="titleMedium" style={[styles.title, { color: colors.onSurface }]} numberOfLines={2}>
          {listing.title}
        </Text>

        {/* Price */}
        <Text style={[styles.price, { color: colors.primary }]}>
          {priceDisplay}
          {listing.isNegotiable && (
            <Text style={[styles.negotiable, { color: colors.onSurfaceVariant }]}> (Negotiable)</Text>
          )}
        </Text>

        {/* Flat details chips */}
        {listing.type === 'flat_rent' || listing.type === 'flat_sale' ? (
          <View style={styles.chips}>
            {listing.flatDetails?.bhkType && (
              <Chip compact style={styles.chip} textStyle={styles.chipText}>
                {listing.flatDetails.bhkType}
              </Chip>
            )}
            {listing.flatDetails?.furnishing && (
              <Chip compact style={styles.chip} textStyle={styles.chipText}>
                {listing.flatDetails.furnishing}
              </Chip>
            )}
            {listing.flatDetails?.parking && (
              <Chip compact icon="car" style={styles.chip} textStyle={styles.chipText}>
                Parking
              </Chip>
            )}
          </View>
        ) : null}

        {/* Description preview */}
        <Text
          variant="bodySmall"
          style={[styles.desc, { color: colors.onSurfaceVariant }]}
          numberOfLines={2}
        >
          {listing.description}
        </Text>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.outlineVariant }]}>
          <View style={styles.posterRow}>
            <Ionicons name="person-circle-outline" size={14} color={colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={[styles.posterText, { color: colors.onSurfaceVariant }]}>
              {poster
                ? `${poster.firstName} ${poster.lastName}${poster.flatNumber ? ` · Flat ${poster.flatNumber}` : ''}`
                : 'Society Member'}
            </Text>
          </View>
          <View style={styles.metaRight}>
            {listing.views > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="eye-outline" size={12} color={colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft: 3 }}>
                  {listing.views}
                </Text>
              </View>
            )}
            {listing.interestCount > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="heart-outline" size={12} color={colors.error} />
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft: 3 }}>
                  {listing.interestCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeLabel: { fontSize: 11, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusLabel: { fontSize: 10, fontWeight: '700' },
  title: { fontWeight: '700', marginBottom: 4, lineHeight: 22 },
  price: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  negotiable: { fontSize: 12, fontWeight: '400' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { height: 24, borderRadius: 12 },
  chipText: { fontSize: 10, marginVertical: 0, lineHeight: 12 },
  desc: { marginBottom: 10, lineHeight: 18 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  posterRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  posterText: { flex: 1 },
  metaRight: { flexDirection: 'row', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
});