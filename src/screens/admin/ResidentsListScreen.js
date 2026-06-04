// src/screens/admin/ResidentsListScreen.js
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { Text, useTheme, Appbar, Searchbar, Badge } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  useResidents,
  useApproveResident,
  useRejectResident,
  useDeactivateResident,
  useReactivateResident,
} from '../../hooks/useResidents';
import ResidentCard from '../../components/admin/ResidentCard';
import ConfirmationModal from '../../components/resident/ConfirmationModal';
import { SkeletonList } from '../../components/resident/SkeletonCard';
import { EmptyState, ErrorState } from '../../components/common';

const ADMIN_ACCENT = '#4A148C';

const STATUS_TABS = [
  { key: 'all',      label: 'All',      color: ADMIN_ACCENT },
  { key: 'pending',  label: 'Pending',  color: '#E65100' },
  { key: 'active',   label: 'Active',   color: '#2E7D32' },
  { key: 'inactive', label: 'Inactive', color: '#757575' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusFilterBar({ active, onChange, counts }) {
  return (
    <View style={styles.filterBar}>
      {STATUS_TABS.map((tab) => {
        const isActive = active === tab.key;
        const count    = counts[tab.key] ?? 0;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterChip,
              isActive && { backgroundColor: tab.color, borderColor: tab.color },
            ]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, isActive && { color: '#fff' }]}>
              {tab.label}
            </Text>
            {count > 0 && (
              <View style={[
                styles.filterBadge,
                { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : tab.color + '20' },
              ]}>
                <Text style={[styles.filterBadgeText, { color: isActive ? '#fff' : tab.color }]}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ResidentsListScreen() {
  const { colors } = useTheme();
  const [search, setSearch]         = useState('');
  const [activeTab, setActiveTab]   = useState('all');
  const [loadingId, setLoadingId]   = useState(null);

  // Confirmation modal state
  const [modal, setModal] = useState({
    visible: false, type: null, residentId: null, residentName: '',
  });

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, error, refetch, isRefetching } = useResidents();

  const allResidents = useMemo(() => {
    const raw = data?.data;
    if (Array.isArray(raw)) return raw;
    return [];
  }, [data]);

  // Count per status (residents only — guards/admins excluded from this screen logic)
  const counts = useMemo(() => {
    const c = { all: 0, pending: 0, active: 0, inactive: 0 };
    allResidents.forEach((r) => {
      c.all++;
      if (r.status === 'pending')  c.pending++;
      if (r.status === 'active')   c.active++;
      if (r.status === 'inactive') c.inactive++;
    });
    return c;
  }, [allResidents]);

  const filtered = useMemo(() => {
    let list = activeTab === 'all'
      ? allResidents
      : allResidents.filter((r) => r.status === activeTab);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.mobile?.includes(q) ||
        r.flatNumber?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allResidents, activeTab, search]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const approve    = useApproveResident();
  const reject     = useRejectResident();
  const deactivate = useDeactivateResident();
  const reactivate = useReactivateResident();

  const runMutation = useCallback(async (mutationFn, id) => {
    setLoadingId(id);
    try {
      await mutationFn();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setLoadingId(null);
      setModal({ visible: false, type: null, residentId: null, residentName: '' });
    }
  }, []);

  const handleConfirm = useCallback(() => {
    const { type, residentId } = modal;
    if (!residentId) return;

    if (type === 'approve')
      return runMutation(() => approve.mutateAsync(residentId), residentId);
    if (type === 'reject')
      return runMutation(() => reject.mutateAsync({ id: residentId, softDelete: false }), residentId);
    if (type === 'deactivate')
      return runMutation(() => deactivate.mutateAsync(residentId), residentId);
    if (type === 'reactivate')
      return runMutation(() => reactivate.mutateAsync(residentId), residentId);
  }, [modal, approve, reject, deactivate, reactivate, runMutation]);

  const openModal = useCallback((type, residentId, residentName) => {
    setModal({ visible: true, type, residentId, residentName });
  }, []);

  // ── Modal config per type ─────────────────────────────────────────────────
  const MODAL_CONFIG = {
    approve: {
      icon: 'checkmark-circle-outline',
      color: '#2E7D32',
      title: 'Approve Resident',
      message: (name) => `Approve ${name}'s registration? They will be able to log in immediately.`,
      confirmLabel: 'Approve',
    },
    reject: {
      icon: 'close-circle-outline',
      color: '#C62828',
      title: 'Reject Registration',
      message: (name) => `Reject and remove ${name}'s registration request? This cannot be undone.`,
      confirmLabel: 'Reject & Remove',
    },
    deactivate: {
      icon: 'ban-outline',
      color: '#E65100',
      title: 'Deactivate Resident',
      message: (name) => `Deactivate ${name}? They won't be able to log in until reactivated.`,
      confirmLabel: 'Deactivate',
    },
    reactivate: {
      icon: 'refresh-circle-outline',
      color: '#1565C0',
      title: 'Reactivate Resident',
      message: (name) => `Reactivate ${name}? They will regain access to the app.`,
      confirmLabel: 'Reactivate',
    },
  };

  const cfg = modal.type ? MODAL_CONFIG[modal.type] : null;

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <Appbar.Header style={[styles.appbar, { backgroundColor: colors.surface }]}>
          <Appbar.Content
            title="Residents"
            titleStyle={{ fontWeight: '800', color: ADMIN_ACCENT }}
          />
        </Appbar.Header>
        <SkeletonList count={7} />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <Appbar.Header style={[styles.appbar, { backgroundColor: colors.surface }]}>
          <Appbar.Content
            title="Residents"
            titleStyle={{ fontWeight: '800', color: ADMIN_ACCENT }}
          />
        </Appbar.Header>
        <ErrorState
          error={error?.response?.data?.message ?? 'Failed to load residents'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: '#F5F3FF' }]}>
      {/* Header */}
      <Appbar.Header style={[styles.appbar, { backgroundColor: colors.surface }]}>
        <Appbar.Content
          title="Residents"
          subtitle={`${filtered.length} shown`}
          titleStyle={{ fontWeight: '800', color: ADMIN_ACCENT }}
        />
        {/* Pending badge on header */}
        {counts.pending > 0 && (
          <View style={styles.pendingPill}>
            <Text style={styles.pendingPillText}>{counts.pending} pending</Text>
          </View>
        )}
      </Appbar.Header>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Searchbar
          placeholder="Search by name, flat, email…"
          value={search}
          onChangeText={setSearch}
          style={[styles.searchbar, { backgroundColor: colors.surface }]}
          inputStyle={{ fontSize: 14 }}
        />
      </View>

      {/* Status filter tabs */}
      <StatusFilterBar active={activeTab} onChange={setActiveTab} counts={counts} />

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ResidentCard
            resident={item}
            loadingId={loadingId}
            onApprove={(id) => openModal('approve', id, `${item.firstName} ${item.lastName}`)}
            onReject={(id) => openModal('reject', id, `${item.firstName} ${item.lastName}`)}
            onDeactivate={(id) => openModal('deactivate', id, `${item.firstName} ${item.lastName}`)}
            onReactivate={(id) => openModal('reactivate', id, `${item.firstName} ${item.lastName}`)}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[ADMIN_ACCENT]}
            tintColor={ADMIN_ACCENT}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={
              activeTab === 'pending'
                ? 'No pending registrations'
                : `No ${activeTab === 'all' ? '' : activeTab + ' '}residents found`
            }
            subtitle={search ? 'Try a different search term.' : 'Nothing here yet.'}
          />
        }
      />

      {/* Confirmation modal */}
      {cfg && (
        <ConfirmationModal
          visible={modal.visible}
          icon={cfg.icon}
          confirmColor={cfg.color}
          title={cfg.title}
          message={cfg.message(modal.residentName)}
          confirmLabel={cfg.confirmLabel}
          loading={loadingId === modal.residentId}
          onConfirm={handleConfirm}
          onDismiss={() => setModal({ visible: false, type: null, residentId: null, residentName: '' })}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1 },
  appbar:  { elevation: 0, borderBottomWidth: 1, borderBottomColor: '#EDE7F6' },

  pendingPill: {
    backgroundColor: '#E65100',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 12,
  },
  pendingPillText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchbar:  { borderRadius: 14, elevation: 0 },

  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  filterChipText: { fontSize: 13, fontWeight: '700', color: '#555' },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterBadgeText: { fontSize: 11, fontWeight: '800' },

  list: { padding: 16, paddingBottom: 40 },
});