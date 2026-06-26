// src/screens/resident/SosScreen.js
import React, { useState, useRef } from 'react';
import {
  View, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Animated, Linking,
} from 'react-native';
import { Text, useTheme, Appbar, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { useTriggerSos, useMySosAlerts } from '../../hooks/useSos';

const EMERGENCY_CONTACTS = [
  { label: 'Police',        number: '100', icon: 'shield-outline',         color: '#1565C0' },
  { label: 'Ambulance',     number: '108', icon: 'medkit-outline',          color: '#C62828' },
  { label: 'Fire Brigade',  number: '101', icon: 'flame-outline',           color: '#E65100' },
  { label: 'Women Helpline',number: '1091', icon: 'female-outline',         color: '#9C27B0' },
];

const STATUS_CONFIG = {
  active:       { label: 'Active',       color: '#C62828', bg: '#FFEBEE' },
  acknowledged: { label: 'Acknowledged', color: '#E65100', bg: '#FFF3E0' },
  resolved:     { label: 'Resolved',     color: '#2E7D32', bg: '#E8F5E9' },
};

function AlertHistoryCard({ alert }) {
  const sc = STATUS_CONFIG[alert.status] ?? STATUS_CONFIG.resolved;
  return (
    <Surface style={styles.histCard} elevation={1}>
      <View style={styles.histCardLeft}>
        <View style={[styles.histDot, { backgroundColor: sc.color }]} />
        <View>
          <Text style={styles.histMsg} numberOfLines={1}>{alert.message}</Text>
          <Text style={styles.histTime}>
            {new Date(alert.createdAt).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
          {alert.acknowledgedBy && (
            <Text style={styles.histAck}>
              Acknowledged by {alert.acknowledgedBy.firstName}
            </Text>
          )}
        </View>
      </View>
      <View style={[styles.histBadge, { backgroundColor: sc.bg }]}>
        <Text style={[styles.histBadgeText, { color: sc.color }]}>{sc.label}</Text>
      </View>
    </Surface>
  );
}

export default function SosScreen({ navigation }) {
  const { colors } = useTheme();
  const user = useSelector(selectCurrentUser);
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimer = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const triggerMutation = useTriggerSos();
  const { data: historyData, refetch } = useMySosAlerts();
  const history = historyData?.data ?? [];

  const activeAlert = history.find(a => a.status === 'active' || a.status === 'acknowledged');

  const startHold = () => {
    setHolding(true);
    setHoldProgress(0);
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();
    holdTimer.current = setTimeout(() => {
      fireSos();
    }, 3000);
  };

  const cancelHold = () => {
    setHolding(false);
    setHoldProgress(0);
    progressAnim.setValue(0);
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const fireSos = () => {
    setHolding(false);
    progressAnim.setValue(0);
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    triggerMutation.mutate(
      `Emergency from Flat ${user?.flatNumber ?? 'Unknown'}! Immediate assistance needed.`,
      {
        onSuccess: () => {
          refetch();
          Alert.alert(
            '🚨 SOS Triggered',
            'Your emergency alert has been sent. Guards have been notified. Stay calm and stay where you are.',
            [{ text: 'OK' }]
          );
        },
        onError: () => Alert.alert('Error', 'Could not send SOS. Please call emergency services directly.'),
      }
    );
  };

  const ringWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 160] });

  return (
    <SafeAreaView  edges={['bottom']} style={[styles.screen, { backgroundColor: '#FFF5F5' }]}>
      <Appbar.Header style={{ backgroundColor: '#FFF5F5', elevation: 0 }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="SOS Emergency" titleStyle={{ fontWeight: '700', color: '#C62828' }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Active alert banner */}
        {activeAlert && (
          <View style={styles.activeBanner}>
            <Ionicons name="warning" size={18} color="#fff" />
            <Text style={styles.activeBannerText}>
              Alert {activeAlert.status === 'active' ? 'sent — waiting for guard' : 'acknowledged by guard'}
            </Text>
          </View>
        )}

        {/* SOS Button */}
        <View style={styles.sosContainer}>
          <Text style={styles.sosLabel}>Hold for 3 seconds to trigger SOS</Text>

          <View style={styles.sosRingOuter}>
            {holding && (
              <Animated.View style={[styles.sosRingProgress, {
                width: ringWidth, height: ringWidth,
                borderRadius: 80,
              }]} />
            )}
            <TouchableOpacity
              style={[styles.sosBtn, triggerMutation.isPending && { opacity: 0.7 }]}
              onPressIn={startHold}
              onPressOut={cancelHold}
              activeOpacity={1}
              disabled={triggerMutation.isPending}
            >
              <Ionicons name="warning" size={44} color="#fff" />
              <Text style={styles.sosBtnText}>SOS</Text>
              {holding && <Text style={styles.sosBtnSub}>Hold…</Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.sosHint}>
            {triggerMutation.isPending
              ? 'Sending alert…'
              : 'This will immediately alert all guards in your society.'}
          </Text>
        </View>

        {/* Resident info */}
        <Surface style={styles.infoCard} elevation={2}>
          <Ionicons name="person-circle-outline" size={22} color="#1565C0" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.infoFlat}>Flat {user?.flatNumber} · {user?.mobile}</Text>
          </View>
        </Surface>

        {/* Emergency Contacts */}
        <Text style={styles.sectionTitle}>Emergency Numbers</Text>
        <View style={styles.contactsGrid}>
          {EMERGENCY_CONTACTS.map(c => (
            <TouchableOpacity
              key={c.number}
              style={[styles.contactCard, { borderColor: c.color + '40' }]}
              onPress={() => Linking.openURL(`tel:${c.number}`).catch(() => {})}
            >
              <View style={[styles.contactIcon, { backgroundColor: c.color + '18' }]}>
                <Ionicons name={c.icon} size={22} color={c.color} />
              </View>
              <Text style={styles.contactLabel}>{c.label}</Text>
              <Text style={[styles.contactNum, { color: c.color }]}>{c.number}</Text>
              <View style={[styles.callBtn, { backgroundColor: c.color }]}>
                <Ionicons name="call" size={14} color="#fff" />
                <Text style={styles.callBtnText}>Call</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Alert history */}
        {history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your Alert History</Text>
            <View style={styles.histList}>
              {history.map(a => <AlertHistoryCard key={a._id} alert={a} />)}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 40 },

  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#C62828', paddingHorizontal: 16, paddingVertical: 10,
  },
  activeBannerText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  sosContainer: { alignItems: 'center', paddingVertical: 32 },
  sosLabel: { fontSize: 14, color: '#C62828', fontWeight: '600', marginBottom: 24 },

  sosRingOuter: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#FFE5E5', borderWidth: 3, borderColor: '#FFBBBB',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    position: 'relative', overflow: 'hidden',
  },
  sosRingProgress: {
    position: 'absolute',
    backgroundColor: '#FF1744',
    opacity: 0.25,
  },
  sosBtn: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#C62828',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C62828', shadowOpacity: 0.4,
    shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  sosBtnText: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 2, marginTop: 4 },
  sosBtnSub: { color: '#ffcdd2', fontSize: 13, marginTop: 2 },
  sosHint: { fontSize: 13, color: '#757575', textAlign: 'center', paddingHorizontal: 40 },

  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, borderRadius: 16, padding: 14, backgroundColor: '#fff',
  },
  infoName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  infoFlat: { fontSize: 12, color: '#757575', marginTop: 2 },

  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: '#1A1A2E',
    marginHorizontal: 16, marginTop: 24, marginBottom: 12,
  },

  contactsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16 },
  contactCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 6, borderWidth: 1.5,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  contactIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', textAlign: 'center' },
  contactNum: { fontSize: 18, fontWeight: '900' },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  callBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  histList: { paddingHorizontal: 16, gap: 8 },
  histCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, padding: 12, backgroundColor: '#fff',
  },
  histCardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  histDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  histMsg: { fontSize: 13, fontWeight: '600', color: '#1A1A2E', flex: 1 },
  histTime: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  histAck: { fontSize: 11, color: '#2E7D32', marginTop: 2 },
  histBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  histBadgeText: { fontSize: 11, fontWeight: '700' },
});