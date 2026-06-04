// src/screens/resident/AmenityBookingScreen.js
import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  Modal, Alert,
} from 'react-native';
import { Text, useTheme, Appbar, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAmenities, useAmenitySlots, useMyBookings, useBookSlot, useCancelBooking } from '../../hooks/useAmenities';
import { EmptyState, ErrorState } from '../../components/common';

const AMENITY_META = {
  clubhouse: { icon: 'business-outline',    color: '#9C27B0', label: 'Clubhouse' },
  gym:       { icon: 'barbell-outline',      color: '#E65100', label: 'Gym' },
  pool:      { icon: 'water-outline',        color: '#1565C0', label: 'Pool' },
  tennis:    { icon: 'tennisball-outline',   color: '#2E7D32', label: 'Tennis' },
  badminton: { icon: 'fitness-outline',      color: '#00897B', label: 'Badminton' },
  garden:    { icon: 'leaf-outline',         color: '#558B2F', label: 'Garden' },
  parking:   { icon: 'car-outline',          color: '#546E7A', label: 'Parking' },
  other:     { icon: 'apps-outline',         color: '#607D8B', label: 'Other' },
};

const getMeta = (type) => AMENITY_META[type] ?? AMENITY_META.other;

function AmenityCard({ amenity, onBook }) {
  const meta = getMeta(amenity.type);
  return (
    <TouchableOpacity onPress={() => onBook(amenity)} activeOpacity={0.8}>
      <Surface style={styles.amenityCard} elevation={2}>
        <View style={[styles.amenityIconWrap, { backgroundColor: meta.color + '18' }]}>
          <Ionicons name={meta.icon} size={28} color={meta.color} />
        </View>
        <Text style={styles.amenityName}>{amenity.name}</Text>
        <Text style={styles.amenityHours}>{amenity.openTime} – {amenity.closeTime}</Text>
        <View style={[styles.bookBtn, { backgroundColor: meta.color }]}>
          <Text style={styles.bookBtnText}>Book</Text>
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

// Date selector strip (today + 6 days)
function DateStrip({ selected, onSelect }) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' });
    const num = d.getDate();
    days.push({ iso, label, num });
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateStrip}>
      {days.map(d => (
        <TouchableOpacity
          key={d.iso}
          style={[styles.dateChip, selected === d.iso && styles.dateChipActive]}
          onPress={() => onSelect(d.iso)}
        >
          <Text style={[styles.dateChipLabel, selected === d.iso && styles.dateChipTextActive]}>{d.label}</Text>
          <Text style={[styles.dateChipNum, selected === d.iso && styles.dateChipTextActive]}>{d.num}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function SlotGrid({ slots, selectedSlot, onSelect }) {
  if (!slots || slots.length === 0) {
    return <Text style={styles.noSlots}>No slots available for this date.</Text>;
  }
  return (
    <View style={styles.slotGrid}>
      {slots.map(slot => (
        <TouchableOpacity
          key={slot.startTime}
          style={[
            styles.slotChip,
            !slot.available && styles.slotChipBooked,
            selectedSlot?.startTime === slot.startTime && styles.slotChipSelected,
          ]}
          onPress={() => slot.available && onSelect(slot)}
          disabled={!slot.available}
        >
          <Text style={[
            styles.slotChipText,
            !slot.available && styles.slotChipTextBooked,
            selectedSlot?.startTime === slot.startTime && styles.slotChipTextSelected,
          ]}>
            {slot.startTime}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function BookingModal({ visible, amenity, onClose }) {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');

  const { data: slotsData, isLoading: slotsLoading } = useAmenitySlots(
    visible ? amenity?._id : null,
    selectedDate
  );
  const bookMutation = useBookSlot();
  const meta = getMeta(amenity?.type);
  const slots = slotsData?.data?.slots ?? [];

  const handleBook = () => {
    if (!selectedSlot) return Alert.alert('Select Slot', 'Please choose a time slot.');
    bookMutation.mutate(
      { amenityId: amenity._id, date: selectedDate, startTime: selectedSlot.startTime, endTime: selectedSlot.endTime, notes },
      { onSuccess: () => { onClose(); setSelectedSlot(null); } }
    );
  };

  if (!amenity) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, maxHeight: '90%' }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.amenityIconWrap, { backgroundColor: meta.color + '18', width: 42, height: 42 }]}>
                <Ionicons name={meta.icon} size={20} color={meta.color} />
              </View>
              <View>
                <Text style={styles.sheetTitle}>{amenity.name}</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12 }}>
                  {amenity.openTime} – {amenity.closeTime} · {amenity.slotDurationMinutes} min slots
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Select Date</Text>
            <DateStrip selected={selectedDate} onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }} />

            <Text style={styles.sectionLabel}>Select Time Slot</Text>
            {slotsLoading ? (
              <Text style={{ color: colors.onSurfaceVariant, paddingHorizontal: 20 }}>Loading slots…</Text>
            ) : (
              <SlotGrid slots={slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
            )}

            {selectedSlot && (
              <View style={[styles.selectedSummary, { backgroundColor: meta.color + '12', borderColor: meta.color }]}>
                <Ionicons name="checkmark-circle" size={18} color={meta.color} />
                <Text style={[styles.selectedSummaryText, { color: meta.color }]}>
                  {selectedDate} · {selectedSlot.startTime} – {selectedSlot.endTime}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: meta.color }, bookMutation.isPending && { opacity: 0.6 }]}
              onPress={handleBook}
              disabled={bookMutation.isPending || !selectedSlot}
            >
              <Ionicons name="calendar-outline" size={18} color="#fff" />
              <Text style={styles.confirmBtnText}>{bookMutation.isPending ? 'Booking…' : 'Confirm Booking'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function MyBookingCard({ booking, onCancel }) {
  const meta = getMeta(booking.amenityId?.type);
  const isPast = booking.date < new Date().toISOString().split('T')[0];
  const isCancelled = booking.status === 'cancelled';

  return (
    <Surface style={[styles.bookingCard, isCancelled && { opacity: 0.55 }]} elevation={1}>
      <View style={[styles.bookingIconWrap, { backgroundColor: meta.color + '18' }]}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>
      <View style={styles.bookingBody}>
        <Text style={styles.bookingName}>{booking.amenityId?.name ?? '—'}</Text>
        <Text style={styles.bookingTime}>{booking.date} · {booking.startTime} – {booking.endTime}</Text>
        <View style={[styles.statusBadge, {
          backgroundColor: isCancelled ? '#FFEBEE' : isPast ? '#F5F5F5' : '#E8F5E9'
        }]}>
          <Text style={[styles.statusText, {
            color: isCancelled ? '#C62828' : isPast ? '#757575' : '#2E7D32'
          }]}>
            {isCancelled ? 'Cancelled' : isPast ? 'Completed' : 'Confirmed'}
          </Text>
        </View>
      </View>
      {!isCancelled && !isPast && (
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: '#FFEBEE' }]}
          onPress={() => Alert.alert('Cancel Booking', 'Are you sure?', [
            { text: 'No', style: 'cancel' },
            { text: 'Yes, Cancel', style: 'destructive', onPress: () => onCancel(booking._id) },
          ])}
        >
          <Ionicons name="close" size={18} color="#C62828" />
        </TouchableOpacity>
      )}
    </Surface>
  );
}

export default function AmenityBookingScreen({ navigation }) {
  const { colors } = useTheme();
  const [bookingTarget, setBookingTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('amenities'); // 'amenities' | 'my-bookings'

  const { data: amenitiesData, isLoading, isError, error, refetch } = useAmenities();
  const { data: bookingsData, refetch: refetchBookings } = useMyBookings();
  const cancelMutation = useCancelBooking();

  const amenities = amenitiesData?.data ?? [];
  const bookings  = bookingsData?.data  ?? [];

  if (isError) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <Appbar.Header style={{ backgroundColor: colors.surface }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Amenity Booking" titleStyle={{ fontWeight: '700' }} />
        </Appbar.Header>
        <ErrorState error={error?.response?.data?.message ?? 'Failed to load'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: '#F8F9FB' }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Amenity Booking" titleStyle={{ fontWeight: '700' }} />
      </Appbar.Header>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'amenities' && styles.tabActive]}
          onPress={() => setActiveTab('amenities')}
        >
          <Text style={[styles.tabText, activeTab === 'amenities' && styles.tabTextActive]}>Amenities</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-bookings' && styles.tabActive]}
          onPress={() => { setActiveTab('my-bookings'); refetchBookings(); }}
        >
          <Text style={[styles.tabText, activeTab === 'my-bookings' && styles.tabTextActive]}>My Bookings</Text>
          {bookings.filter(b => b.status === 'confirmed').length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{bookings.filter(b => b.status === 'confirmed').length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'amenities' ? (
          amenities.length === 0 && !isLoading ? (
            <EmptyState
              icon="business-outline"
              title="No amenities available"
              subtitle="Your society hasn't added any amenities yet. Contact the admin."
            />
          ) : (
            <View style={styles.amenityGrid}>
              {amenities.map(a => <AmenityCard key={a._id} amenity={a} onBook={setBookingTarget} />)}
            </View>
          )
        ) : (
          bookings.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No bookings yet"
              subtitle="Book a slot for the gym, pool, or clubhouse and it will appear here."
            />
          ) : (
            <View style={styles.bookingsList}>
              {bookings.map(b => (
                <MyBookingCard key={b._id} booking={b} onCancel={(id) => cancelMutation.mutate(id)} />
              ))}
            </View>
          )
        )}
      </ScrollView>

      <BookingModal
        visible={!!bookingTarget}
        amenity={bookingTarget}
        onClose={() => setBookingTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#1565C0' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9E9E9E' },
  tabTextActive: { color: '#1565C0' },
  tabBadge: { backgroundColor: '#1565C0', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amenityCard: {
    width: '47%', borderRadius: 18, padding: 16, backgroundColor: '#fff',
    alignItems: 'center', gap: 8,
  },
  amenityIconWrap: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  amenityName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E', textAlign: 'center' },
  amenityHours: { fontSize: 11, color: '#9E9E9E', textAlign: 'center' },
  bookBtn: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20, marginTop: 4 },
  bookBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Date strip
  dateStrip: { paddingHorizontal: 16, marginBottom: 12 },
  dateChip: {
    width: 54, paddingVertical: 10, borderRadius: 14, alignItems: 'center',
    marginRight: 8, backgroundColor: '#F5F5F5',
  },
  dateChipActive: { backgroundColor: '#1565C0' },
  dateChipLabel: { fontSize: 11, color: '#757575', fontWeight: '600' },
  dateChipNum: { fontSize: 16, color: '#1A1A2E', fontWeight: '800', marginTop: 2 },
  dateChipTextActive: { color: '#fff' },

  // Slots
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  slotChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#1565C0', backgroundColor: '#fff',
  },
  slotChipBooked: { borderColor: '#E0E0E0', backgroundColor: '#F5F5F5' },
  slotChipSelected: { backgroundColor: '#1565C0' },
  slotChipText: { fontSize: 13, fontWeight: '600', color: '#1565C0' },
  slotChipTextBooked: { color: '#BDBDBD' },
  slotChipTextSelected: { color: '#fff' },
  noSlots: { paddingHorizontal: 16, color: '#9E9E9E', fontStyle: 'italic' },

  selectedSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, padding: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 12,
  },
  selectedSummaryText: { fontSize: 14, fontWeight: '700' },

  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginBottom: 8, paddingVertical: 14, borderRadius: 14,
  },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#555', paddingHorizontal: 16, marginBottom: 10, marginTop: 16 },

  // My bookings
  bookingsList: { gap: 10 },
  bookingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 14, backgroundColor: '#fff',
  },
  bookingIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bookingBody: { flex: 1, gap: 3 },
  bookingName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  bookingTime: { fontSize: 12, color: '#757575' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  iconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 36 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#1A1A2E' },
});