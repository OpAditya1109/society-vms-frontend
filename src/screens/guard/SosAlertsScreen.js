// src/screens/guard/SosAlertsScreen.js
import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Linking } from 'react-native';
import { Text, useTheme, Appbar, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useSosAlerts, useAcknowledgeSos, useResolveSos } from '../../hooks/useSos';
import { EmptyState } from '../../components/common';

const GUARD_ACCENT = '#E65100';

const STATUS_CONFIG = {
  active:       { label: 'ACTIVE',       color: '#C62828', bg: '#FFEBEE', pulse: true },
  acknowledged: { label: 'ACKNOWLEDGED', color: '#E65100', bg: '#FFF3E0', pulse: false },
  resolved:     { label: 'RESOLVED',     color: '#2E7D32', bg: '#E8F5E9', pulse: false },
};

function AlertCard({ alert, onAcknowledge, onResolve }) {
  const sc = STATUS_CONFIG[alert.status] ?? STATUS_CONFIG.resolved;
  const resident = alert.residentId;

  return (
    <Surface style={[styles.alertCard, alert.status === 'active' && styles.alertCardActive]} elevation={3}>
      <View style={styles.alertHeader}>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: sc.color }]} />
          <Text style={[styles.statusLabel, { color: sc.color }]}>{sc.label}</Text>
        </View>
        <Text style={styles.alertTime}>
          {new Date(alert.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <Text style={styles.alertMessage}>{alert.message}</Text>

      <View style={styles.residentInfo}>
        <Ionicons name="account-outline" size={14} color="#555" />
        <Text style={styles.residentText}>
          {resident?.firstName} {resident?.lastName} · Flat {resident?.flatNumber ?? alert.flatNumber}
        </Text>
      </View>

      {!!resident?.mobile && (
        <TouchableOpacity
          style={styles.callResidentBtn}
          onPress={() => Linking.openURL(`tel:${resident.mobile}`).catch(() => {})}
        >
          <Ionicons name="phone-outline" size={16} color="#1565C0" />
          <Text style={styles.callResidentText}>Call {resident.firstName}: {resident.mobile}</Text>
        </TouchableOpacity>
      )}

      {alert.acknowledgedBy && (
        <Text style={styles.ackedBy}>
          Ack by {alert.acknowledgedBy.firstName} {alert.acknowledgedBy.lastName}
        </Text>
      )}

      <View style={styles.alertActions}>
        {alert.status === 'active' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#FFF3E0' }]}
            onPress={() => onAcknowledge(alert._id)}
          >
            <Ionicons name="eye-outline" size={16} color={GUARD_ACCENT} />
            <Text style={[styles.actionBtnText, { color: GUARD_ACCENT }]}>Acknowledge</Text>
          </TouchableOpacity>
        )}
        {(alert.status === 'active' || alert.status === 'acknowledged') && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]}
            onPress={() => onResolve(alert._id)}
          >
            <Ionicons name="checkmark-done-outline" size={16} color="#2E7D32" />
            <Text style={[styles.actionBtnText, { color: '#2E7D32' }]}>Resolve</Text>
          </TouchableOpacity>
        )}
      </View>
    </Surface>
  );
}

export default function SosAlertsScreen({ navigation }) {
  const { colors } = useTheme();
  const { data, isLoading, refetch, isRefetching } = useSosAlerts();
  const ackMutation = useAcknowledgeSos();
  const resMutation = useResolveSos();
  const alerts = data?.data ?? [];
  const activeCount = alerts.filter(a => a.status === 'active').length;

  const onRefresh = useCallback(() => refetch(), [refetch]);

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: activeCount > 0 ? '#FFF5F5' : colors.background }]}>
      <Appbar.Header style={{ backgroundColor: activeCount > 0 ? '#C62828' : colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} iconColor={activeCount > 0 ? '#fff' : undefined} />
        <Appbar.Content
          title={`SOS Alerts${activeCount > 0 ? ` (${activeCount} Active)` : ''}`}
          titleStyle={{ fontWeight: '700', color: activeCount > 0 ? '#fff' : colors.onSurface }}
        />
        <Appbar.Action icon="refresh" iconColor={activeCount > 0 ? '#fff' : undefined} onPress={refetch} />
      </Appbar.Header>

      <FlatList
        data={alerts}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[GUARD_ACCENT]} />
        }
        ListEmptyComponent={
          !isLoading && (
            <EmptyState icon="shield-checkmark-outline" title="No active alerts" subtitle="All is well. SOS alerts from residents will appear here." />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <AlertCard
            alert={item}
            onAcknowledge={(id) => ackMutation.mutate(id)}
            onResolve={(id) => resMutation.mutate(id)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },

  alertCard: {
    borderRadius: 18, padding: 16, backgroundColor: '#fff', gap: 10,
  },
  alertCardActive: {
    borderWidth: 2, borderColor: '#C62828',
    shadowColor: '#C62828', shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  alertTime: { fontSize: 12, color: '#9E9E9E', fontWeight: '600' },

  alertMessage: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', lineHeight: 22 },

  residentInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  residentText: { fontSize: 13, color: '#555', fontWeight: '600' },

  callResidentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EEF4FF', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, alignSelf: 'flex-start',
  },
  callResidentText: { fontSize: 13, color: '#1565C0', fontWeight: '600' },

  ackedBy: { fontSize: 11, color: '#2E7D32', fontStyle: 'italic' },

  alertActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
});