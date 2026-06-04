// src/screens/guard/VisitorDetailScreen.js
import React, { useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Image,
} from 'react-native';
import {
  Text, useTheme, Appbar, Surface, Chip, Divider, ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { visitorService } from '../../api/services/visitorService';
import { VISITOR_STATUS, QUERY_KEYS } from '../../constants';
import { AppButton } from '../../components/common';
import { ErrorState } from '../../components/common';

const GUARD_ACCENT = '#E65100';

const STATUS_CFG = {
  [VISITOR_STATUS.PENDING]:     { bg: '#FFF8E1', text: '#F9A825', icon: 'time-outline',              label: 'Pending' },
  [VISITOR_STATUS.APPROVED]:    { bg: '#E8F5E9', text: '#2E7D32', icon: 'checkmark-circle-outline',  label: 'Approved' },
  [VISITOR_STATUS.REJECTED]:    { bg: '#FDECEA', text: '#C62828', icon: 'close-circle-outline',      label: 'Rejected' },
  [VISITOR_STATUS.CHECKED_IN]:  { bg: '#E3F2FD', text: '#1565C0', icon: 'log-in-outline',            label: 'Checked In' },
  [VISITOR_STATUS.CHECKED_OUT]: { bg: '#F1F3F5', text: '#546E7A', icon: 'log-out-outline',           label: 'Checked Out' },
};

function fmt(dateStr, opts) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', opts);
}

function DetailRow({ icon, label, value, colors, accent }) {
  if (!value) return null;
  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.iconWrap, { backgroundColor: (accent || colors.primary) + '1A' }]}>
        <Ionicons name={icon} size={16} color={accent || colors.primary} />
      </View>
      <View style={rowStyles.content}>
        <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {label}
        </Text>
        <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function VisitorDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { visitorId } = route.params ?? {};
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...QUERY_KEYS.VISITOR(visitorId)],
    queryFn: () => visitorService.getVisitorById(visitorId),
    enabled: !!visitorId,
  });

  const visitor = data?.data;
  const sc = STATUS_CFG[visitor?.status] ?? STATUS_CFG[VISITOR_STATUS.PENDING];

  const checkOutMutation = useMutation({
    mutationFn: () => visitorService.checkOutVisitor(visitorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VISITOR(visitorId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VISITORS });
      Toast.show({ type: 'success', text1: 'Checked Out', text2: `${visitor?.name} has been checked out.` });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message ?? 'Check-out failed';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <Appbar.Header style={{ backgroundColor: colors.surface }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Visitor Details" titleStyle={{ fontWeight: '700' }} />
        </Appbar.Header>
        <View style={styles.centered}>
          <ActivityIndicator color={GUARD_ACCENT} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !visitor) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <Appbar.Header style={{ backgroundColor: colors.surface }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Visitor Details" titleStyle={{ fontWeight: '700' }} />
        </Appbar.Header>
        <ErrorState
          error={error?.response?.data?.message ?? 'Failed to load visitor details'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  const guardName = visitor.guardId
    ? `${visitor.guardId.firstName ?? ''} ${visitor.guardId.lastName ?? ''}`.trim() || 'Guard'
    : null;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Visitor Details" titleStyle={{ fontWeight: '700' }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Photo + name banner */}
        <Surface style={[styles.banner, { backgroundColor: colors.surface }]} elevation={2}>
          {visitor.photoUrl ? (
            <Image
              source={{ uri: visitor.photoUrl }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: GUARD_ACCENT + '18' }]}>
              <Ionicons name="account-outline" size={44} color={GUARD_ACCENT} />
            </View>
          )}
          <View style={styles.bannerText}>
            <Text variant="headlineSmall" style={{ color: colors.onSurface, fontWeight: '700' }}>
              {visitor.name}
            </Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
              {visitor.mobile}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Ionicons name={sc.icon} size={13} color={sc.text} />
              <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
            </View>
          </View>
        </Surface>

        {/* Visit Info */}
        <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={2}>
          <Text variant="titleSmall" style={[styles.cardLabel, { color: colors.onSurfaceVariant }]}>
            Visit Information
          </Text>
          <Divider style={{ marginBottom: 12 }} />
          <DetailRow icon="home-outline"      label="Flat"           value={visitor.flatNumber}  colors={colors} accent={GUARD_ACCENT} />
          <DetailRow icon="briefcase-outline" label="Purpose"        value={visitor.purpose}     colors={colors} accent={GUARD_ACCENT} />
          <DetailRow icon="car-outline"       label="Vehicle Number" value={visitor.vehicleNumber} colors={colors} accent={GUARD_ACCENT} />
          <DetailRow icon="person-circle-outline" label="Resident"
            value={visitor.residentId
              ? `${visitor.residentId.firstName ?? ''} ${visitor.residentId.lastName ?? ''}`.trim()
              : null}
            colors={colors}
            accent={colors.primary}
          />
        </Surface>

        {/* Timestamps */}
        <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={2}>
          <Text variant="titleSmall" style={[styles.cardLabel, { color: colors.onSurfaceVariant }]}>
            Timeline
          </Text>
          <Divider style={{ marginBottom: 12 }} />
          <DetailRow
            icon="calendar-outline"
            label="Logged At"
            value={fmt(visitor.createdAt, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
            colors={colors}
          />
          <DetailRow
            icon="log-in-outline"
            label="Check-In Time"
            value={visitor.checkInTime
              ? fmt(visitor.checkInTime, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
              : null}
            colors={colors}
            accent="#1565C0"
          />
          <DetailRow
            icon="log-out-outline"
            label="Check-Out Time"
            value={visitor.checkOutTime
              ? fmt(visitor.checkOutTime, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
              : null}
            colors={colors}
            accent="#546E7A"
          />
          {visitor.expectedArrival && (
            <DetailRow
              icon="time-outline"
              label="Expected Arrival"
              value={fmt(visitor.expectedArrival, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
              colors={colors}
            />
          )}
        </Surface>

        {/* Guard info */}
        {guardName && (
          <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={2}>
            <Text variant="titleSmall" style={[styles.cardLabel, { color: colors.onSurfaceVariant }]}>
              Logged By
            </Text>
            <Divider style={{ marginBottom: 12 }} />
            <DetailRow icon="shield-outline" label="Guard" value={guardName} colors={colors} accent={GUARD_ACCENT} />
          </Surface>
        )}

        {/* Rejection reason */}
        {visitor.rejectionReason && (
          <Surface style={[styles.card, { backgroundColor: '#FDECEA' }]} elevation={1}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="close-circle-outline" size={18} color="#C62828" />
              <Text variant="titleSmall" style={{ fontWeight: '700', color: '#C62828' }}>Rejection Reason</Text>
            </View>
            <Text variant="bodyMedium" style={{ color: '#B71C1C' }}>{visitor.rejectionReason}</Text>
          </Surface>
        )}

        {/* Check-out action */}
        {visitor.status === VISITOR_STATUS.CHECKED_IN && (
          <AppButton
            label="Check Out Visitor"
            icon="log-out-outline"
            color={GUARD_ACCENT}
            onPress={() => checkOutMutation.mutate()}
            loading={checkOutMutation.isPending}
            style={styles.checkOutBtn}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 40, gap: 14 },
  banner: { borderRadius: 20, padding: 20, flexDirection: 'row', gap: 16, alignItems: 'center' },
  photo: { width: 80, height: 80, borderRadius: 16 },
  photoPlaceholder: { width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bannerText: { flex: 1, gap: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' },
  card: { borderRadius: 16, padding: 16 },
  cardLabel: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600', marginBottom: 10 },
  checkOutBtn: { marginTop: 4, borderRadius: 14 },
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
});