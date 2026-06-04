// src/screens/resident/VisitorRequestsScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl, TouchableOpacity,
  Modal, ScrollView,
} from 'react-native';
import {
  Text, useTheme, Appbar, Modal as PaperModal, Portal, Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { useVisitors, useApproveVisitor, useRejectVisitor } from '../../hooks/useVisitors';
import VisitorCard from '../../components/resident/VisitorCard';
import ConfirmationModal from '../../components/resident/ConfirmationModal';
import { SkeletonList } from '../../components/resident/SkeletonCard';
import { EmptyState, ErrorState, AppButton, AppInput } from '../../components/common';

const rejectSchema = z.object({
  rejectionReason: z.string().trim().min(3, 'Please provide a reason (min 3 chars)').max(200),
});

// ── QR Pass Generator ──────────────────────────────────────────────────────────
// We generate a visual pass using pure layout (no external QR library needed)
function QrPassModal({ visible, visitor, onClose }) {
  const { colors } = useTheme();
  if (!visitor) return null;

  const passCode = `VMS-${visitor._id?.slice(-8).toUpperCase() ?? 'XXXXXXXX'}`;

  // Simple dot-matrix style QR visual (decorative, represents the pass code)
  const QrVisual = () => {
    const size = 7;
    const pattern = [];
    // Seed deterministic pattern from passCode chars
    for (let r = 0; r < size; r++) {
      pattern.push([]);
      for (let c = 0; c < size; c++) {
        // Corner finders
        const isCorner =
          (r < 2 && c < 2) || (r < 2 && c >= size - 2) || (r >= size - 2 && c < 2);
        // Inner fill using passCode as seed
        const seed = (passCode.charCodeAt((r * size + c) % passCode.length) + r + c) % 3;
        pattern[r].push(isCorner || seed === 0);
      }
    }
    return (
      <View style={qrStyles.qrBox}>
        {pattern.map((row, r) => (
          <View key={r} style={qrStyles.qrRow}>
            {row.map((filled, c) => (
              <View key={c} style={[qrStyles.qrCell, filled && qrStyles.qrCellFilled]} />
            ))}
          </View>
        ))}
      </View>
    );
  };

  const statusColor = {
    approved: '#2E7D32', pending: '#F9A825', rejected: '#C62828', checked_in: '#1565C0', checked_out: '#546E7A',
  }[visitor.status] ?? '#555';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={qrStyles.overlay}>
        <View style={[qrStyles.passCard, { backgroundColor: colors.surface }]}>
          {/* Header strip */}
          <View style={qrStyles.passHeader}>
            <Ionicons name="shield-checkmark" size={22} color="#fff" />
            <Text style={qrStyles.passHeaderText}>VISITOR PASS</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={qrStyles.passBody}>
            {/* QR visual */}
            <View style={qrStyles.qrContainer}>
              <QrVisual />
              <Text style={qrStyles.passCode}>{passCode}</Text>
            </View>

            {/* Divider */}
            <View style={qrStyles.dashes} />

            {/* Info */}
            <View style={qrStyles.infoSection}>
              <PassRow icon="account-outline" label="Visitor" value={visitor.name} />
              <PassRow icon="phone-outline" label="Mobile" value={visitor.mobile} />
              <PassRow icon="clipboard-outline" label="Purpose" value={visitor.purpose} />
              <PassRow icon="home-outline" label="Flat" value={visitor.flatNumber} />
              <PassRow
                icon="ellipse-outline"
                label="Status"
                value={visitor.status?.replace('_', ' ').toUpperCase() ?? '—'}
                valueColor={statusColor}
              />
            </View>

            {/* Footer */}
            <View style={qrStyles.passFooter}>
              <Ionicons name="time-outline" size={12} color="#9E9E9E" />
              <Text style={qrStyles.passFooterText}>
                Generated {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PassRow({ icon, label, value, valueColor }) {
  return (
    <View style={qrStyles.passRow}>
      <View style={qrStyles.passRowLeft}>
        <Ionicons name={icon} size={14} color="#9E9E9E" />
        <Text style={qrStyles.passRowLabel}>{label}</Text>
      </View>
      <Text style={[qrStyles.passRowValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const qrStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  passCard: { borderRadius: 20, overflow: 'hidden', width: '100%', maxWidth: 340, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
  passHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1565C0', paddingHorizontal: 20, paddingVertical: 14 },
  passHeaderText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 2 },
  passBody: { padding: 20, gap: 0 },
  qrContainer: { alignItems: 'center', paddingVertical: 12 },
  qrBox: { gap: 3, padding: 10, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  qrRow: { flexDirection: 'row', gap: 3 },
  qrCell: { width: 16, height: 16, borderRadius: 2, backgroundColor: '#E0E0E0' },
  qrCellFilled: { backgroundColor: '#1A1A2E' },
  passCode: { marginTop: 10, fontSize: 15, fontWeight: '800', color: '#1565C0', letterSpacing: 2 },
  dashes: { borderTopWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed', marginVertical: 14 },
  infoSection: { gap: 10 },
  passRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  passRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  passRowLabel: { fontSize: 12, color: '#9E9E9E', fontWeight: '600' },
  passRowValue: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', maxWidth: '60%', textAlign: 'right' },
  passFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 14, justifyContent: 'center' },
  passFooterText: { fontSize: 11, color: '#9E9E9E' },
});

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function VisitorRequestsScreen() {
  const { colors } = useTheme();
  const user = useSelector(selectCurrentUser);

  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal,  setRejectModal]  = useState(null);
  const [qrModal,      setQrModal]      = useState(null);

  const { data, isLoading, isError, error, refetch, isRefetching } = useVisitors();
  const approveMutation = useApproveVisitor();
  const rejectMutation  = useRejectVisitor();
  const visitors = data?.data ?? [];

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const { control, handleSubmit, reset: resetRejectForm, formState: { errors: rejectErrors } } = useForm({
    resolver: zodResolver(rejectSchema),
    defaultValues: { rejectionReason: '' },
  });

  const openRejectModal = useCallback((visitor) => {
    resetRejectForm({ rejectionReason: '' });
    setRejectModal(visitor);
  }, [resetRejectForm]);

  const handleApproveConfirm = useCallback(() => {
    if (!approveModal) return;
    approveMutation.mutate(approveModal._id, { onSettled: () => setApproveModal(null) });
  }, [approveModal, approveMutation]);

  const handleRejectSubmit = useCallback(({ rejectionReason }) => {
    if (!rejectModal) return;
    rejectMutation.mutate(
      { id: rejectModal._id, rejectionReason },
      { onSettled: () => { setRejectModal(null); resetRejectForm(); } },
    );
  }, [rejectModal, rejectMutation, resetRejectForm]);

  if (isError) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <Appbar.Header style={{ backgroundColor: colors.surface }}>
          <Appbar.Content title="Visitor Requests" titleStyle={{ fontWeight: '700' }} />
        </Appbar.Header>
        <ErrorState error={error?.response?.data?.message ?? 'Failed to load visitors'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.Content title="Visitor Requests" titleStyle={{ fontWeight: '700' }} />
      </Appbar.Header>

      {isLoading ? (
        <View style={{ paddingTop: 16 }}>
          <SkeletonList count={5} />
        </View>
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No visitor requests"
              subtitle="Visitor requests from the guard will show up here."
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <View>
              <VisitorCard
                visitor={item}
                onApprove={() => setApproveModal(item)}
                onReject={() => openRejectModal(item)}
              />
              {/* QR Pass button for approved/checked_in visitors */}
              {(item.status === 'approved' || item.status === 'checked_in') && (
                <TouchableOpacity
                  style={[styles.qrBtn, { borderColor: colors.primary + '40' }]}
                  onPress={() => setQrModal(item)}
                >
                  <Ionicons name="qr-code-outline" size={15} color={colors.primary} />
                  <Text style={[styles.qrBtnText, { color: colors.primary }]}>View Visitor Pass</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      {/* QR Pass Modal */}
      <QrPassModal visible={!!qrModal} visitor={qrModal} onClose={() => setQrModal(null)} />

      {/* Approve confirmation */}
      <ConfirmationModal
        visible={!!approveModal}
        title="Approve Visitor?"
        message={`Allow ${approveModal?.name} to enter? The guard will be notified.`}
        confirmLabel="Approve"
        confirmColor="#2E7D32"
        icon="checkmark-circle-outline"
        loading={approveMutation.isPending}
        onConfirm={handleApproveConfirm}
        onDismiss={() => !approveMutation.isPending && setApproveModal(null)}
      />

      {/* Reject with reason */}
      <Portal>
        <PaperModal
          visible={!!rejectModal}
          onDismiss={() => !rejectMutation.isPending && setRejectModal(null)}
          contentContainerStyle={[styles.rejectModal, { backgroundColor: colors.surface }]}
        >
          <Text variant="titleMedium" style={[styles.rejectTitle, { color: colors.onSurface }]}>
            Reject Visitor
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginBottom: 16 }}>
            Rejecting <Text style={{ fontWeight: '700', color: colors.onSurface }}>{rejectModal?.name}</Text>'s request. Please give a reason.
          </Text>
          <Divider style={{ marginBottom: 16 }} />
          <Controller
            control={control}
            name="rejectionReason"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Reason for rejection"
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={3}
                error={rejectErrors.rejectionReason?.message}
                placeholder="e.g. Unknown visitor, not expected today"
              />
            )}
          />
          <View style={styles.rejectActions}>
            <AppButton label="Cancel" mode="outlined" onPress={() => setRejectModal(null)} style={{ flex: 1 }} disabled={rejectMutation.isPending} />
            <AppButton label="Reject" onPress={handleSubmit(handleRejectSubmit)} loading={rejectMutation.isPending} color="#C62828" style={{ flex: 1 }} />
          </View>
        </PaperModal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  qrBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8, marginTop: -2, marginBottom: 4,
    borderWidth: 1, borderRadius: 0, borderTopWidth: 0,
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    backgroundColor: '#F8F9FB',
  },
  qrBtnText: { fontSize: 13, fontWeight: '600' },
  rejectModal: { margin: 20, borderRadius: 20, padding: 20 },
  rejectTitle: { fontWeight: '700', marginBottom: 6 },
  rejectActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
});