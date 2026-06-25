// src/screens/resident/VisitorRequestsScreen.js
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl, TouchableOpacity,
  Modal, Platform, Image, StatusBar, Dimensions,
} from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
import {
  Text, useTheme, Modal as PaperModal, Portal, Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';

import { selectCurrentUser } from '../../store/slices/authSlice';
import { useVisitors, useApproveVisitor, useRejectVisitor } from '../../hooks/useVisitors';
import VisitorCard from '../../components/resident/VisitorCard';
import ConfirmationModal from '../../components/resident/ConfirmationModal';
import { SkeletonList } from '../../components/resident/SkeletonCard';
import { EmptyState, ErrorState, AppButton, AppInput } from '../../components/common';

const rejectSchema = z.object({
  rejectionReason: z.string().trim().min(3, 'Please provide a reason (min 3 chars)').max(200),
});

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  approved:    { color: '#16A34A', bg: '#DCFCE7', icon: 'checkmark-circle',   label: 'Approved'    },
  pending:     { color: '#D97706', bg: '#FEF3C7', icon: 'time',               label: 'Pending'     },
  rejected:    { color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle',       label: 'Rejected'    },
  checked_in:  { color: '#2563EB', bg: '#DBEAFE', icon: 'enter',              label: 'Checked In'  },
  checked_out: { color: '#64748B', bg: '#F1F5F9', icon: 'exit',               label: 'Checked Out' },
};

// ── QR Pass Modal ──────────────────────────────────────────────────────────
function QrPassModal({ visible, visitor, onClose }) {
  const { colors } = useTheme();
  if (!visitor) return null;

  const passCode = `VMS-${visitor._id?.slice(-8).toUpperCase() ?? 'XXXXXXXX'}`;
  const statusCfg = STATUS_CONFIG[visitor.status] ?? { color: '#555', bg: '#F5F5F5', label: visitor.status };

  const QrVisual = () => {
    const size = 7;
    const pattern = [];
    for (let r = 0; r < size; r++) {
      pattern.push([]);
      for (let c = 0; c < size; c++) {
        const isCorner =
          (r < 2 && c < 2) || (r < 2 && c >= size - 2) || (r >= size - 2 && c < 2);
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={qrStyles.overlay}>
        <View style={qrStyles.passCardShadow}>
          <View style={[qrStyles.passCardInner, { backgroundColor: colors.surface }]}>
            <View style={qrStyles.passHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={qrStyles.passHeaderText}>VISITOR PASS</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={qrStyles.passBody}>
              <View style={qrStyles.qrContainer}>
                <QrVisual />
                <Text style={qrStyles.passCode}>{passCode}</Text>
              </View>

              <View style={qrStyles.dashes} />

              <View style={qrStyles.infoSection}>
                <PassRow icon="account-outline" label="Visitor" value={visitor.name} />
                <PassRow icon="phone-outline" label="Mobile" value={visitor.mobile} />
                <PassRow icon="clipboard-outline" label="Purpose" value={visitor.purpose} />
                <PassRow icon="home-outline" label="Flat" value={visitor.flatNumber} />
                <PassRow
                  icon="ellipse-outline"
                  label="Status"
                  value={statusCfg.label}
                  valueColor={statusCfg.color}
                />
              </View>

              <View style={qrStyles.passFooter}>
                <Ionicons name="time-outline" size={12} color="#9E9E9E" />
                <Text style={qrStyles.passFooterText}>
                  Generated {new Date().toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
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
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  passCardShadow: {
    width: '100%', maxWidth: 340, borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 }, elevation: 12,
  },
  passCardInner: { borderRadius: 20, overflow: 'hidden' },
  passHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1565C0', paddingHorizontal: 20, paddingVertical: 14,
  },
  passHeaderText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 2 },
  passBody: { padding: 20, gap: 0 },
  qrContainer: { alignItems: 'center', paddingVertical: 12 },
  qrBox: {
    gap: 3, padding: 10, backgroundColor: '#fff',
    borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0',
  },
  qrRow: { flexDirection: 'row', gap: 3 },
  qrCell: { width: 16, height: 16, borderRadius: 2, backgroundColor: '#E0E0E0' },
  qrCellFilled: { backgroundColor: '#1A1A2E' },
  passCode: { marginTop: 10, fontSize: 15, fontWeight: '800', color: '#1565C0', letterSpacing: 2 },
  dashes: {
    borderTopWidth: 1.5, borderColor: '#E0E0E0',
    borderStyle: 'dashed', marginVertical: 14,
  },
  infoSection: { gap: 10 },
  passRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  passRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  passRowLabel: { fontSize: 12, color: '#9E9E9E', fontWeight: '600' },
  passRowValue: {
    fontSize: 13, fontWeight: '700', color: '#1A1A2E',
    maxWidth: '60%', textAlign: 'right',
  },
  passFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 14, justifyContent: 'center',
  },
  passFooterText: { fontSize: 11, color: '#9E9E9E' },
});

// ── iOS Date Picker Modal ──────────────────────────────────────────────────
function IoDatePickerModal({ visible, selectedDate, onConfirm, onCancel, colors }) {
  const [tempDate, setTempDate] = useState(selectedDate ?? new Date());

  React.useEffect(() => {
    if (visible) setTempDate(selectedDate ?? new Date());
  }, [visible, selectedDate]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <TouchableOpacity
        style={styles.iosPickerOverlay}
        activeOpacity={1}
        onPress={onCancel}
      />
      <View style={[styles.iosPickerSheet, { backgroundColor: colors.surface }]}>
        <View style={styles.iosPickerHeader}>
          <TouchableOpacity onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.iosPickerAction, { color: colors.onSurfaceVariant }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.iosPickerTitle, { color: colors.onSurface }]}>Select Date</Text>
          <TouchableOpacity onPress={() => onConfirm(tempDate)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.iosPickerAction, { color: colors.primary, fontWeight: '700' }]}>Done</Text>
          </TouchableOpacity>
        </View>
        <Divider />
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="inline"
          maximumDate={new Date()}
          onChange={(_, date) => { if (date) setTempDate(date); }}
          accentColor={colors.primary}
          themeVariant="light"
          style={styles.iosDatePicker}
        />
      </View>
    </Modal>
  );
}

// ── Full-screen photo viewer ───────────────────────────────────────────────
function PhotoViewer({ visible, uri, name, onClose }) {
  if (!uri) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
      <View style={photoStyles.overlay}>
        <TouchableOpacity style={photoStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        {name ? <Text style={photoStyles.nameLabel}>{name}</Text> : null}
        <Image
          source={{ uri }}
          style={photoStyles.fullImage}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
}

const photoStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 8,
  },
  nameLabel: {
    position: 'absolute', top: 56, left: 0, right: 60,
    textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: '700',
  },
  fullImage: { width: SCREEN_W, height: SCREEN_H * 0.75 },
});

// ── Visitor Row Card (redesigned) ──────────────────────────────────────────
function VisitorRowCard({ visitor, onApprove, onReject, onViewPass }) {
  const { colors } = useTheme();
  const [photoVisible, setPhotoVisible] = useState(false);

  const statusCfg = STATUS_CONFIG[visitor.status] ?? { color: '#555', bg: '#F5F5F5', label: visitor.status };
  const showPass = visitor.status === 'approved' || visitor.status === 'checked_in';
  const showActions = visitor.status === 'pending';

  const formattedTime = new Date(visitor.createdAt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={[cardStyles.wrapper, { backgroundColor: colors.surface }]}>
      {/* Left status accent bar */}
      <View style={[cardStyles.accentBar, { backgroundColor: statusCfg.color }]} />

      <View style={cardStyles.content}>
        {/* Top row: avatar/photo + name/phone + status badge */}
        <View style={cardStyles.topRow}>
          {visitor.photoUrl ? (
            <TouchableOpacity onPress={() => setPhotoVisible(true)} activeOpacity={0.85}>
              <Image source={{ uri: visitor.photoUrl }} style={cardStyles.avatarPhoto} />
              <View style={cardStyles.zoomBadge}>
                <Ionicons name="expand-outline" size={9} color="#fff" />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[cardStyles.avatar, { backgroundColor: statusCfg.bg }]}>
              <Text style={[cardStyles.avatarText, { color: statusCfg.color }]}>
                {visitor.name?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
          )}

          <View style={cardStyles.nameBlock}>
            <Text style={[cardStyles.visitorName, { color: colors.onSurface }]} numberOfLines={1}>
              {visitor.name}
            </Text>
            <Text style={[cardStyles.visitorPhone, { color: colors.onSurfaceVariant }]}>
              {visitor.mobile}
            </Text>
          </View>

          <View style={[cardStyles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Ionicons name={statusCfg.icon} size={11} color={statusCfg.color} />
            <Text style={[cardStyles.statusText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        {/* Meta row: purpose + time */}
        <View style={cardStyles.metaRow}>
          <View style={cardStyles.metaItem}>
            <Ionicons name="briefcase-outline" size={12} color={colors.onSurfaceVariant} />
            <Text style={[cardStyles.metaText, { color: colors.onSurfaceVariant }]}>{visitor.purpose}</Text>
          </View>
          <View style={cardStyles.metaDot} />
          <View style={cardStyles.metaItem}>
            <Ionicons name="time-outline" size={12} color={colors.onSurfaceVariant} />
            <Text style={[cardStyles.metaText, { color: colors.onSurfaceVariant }]}>{formattedTime}</Text>
          </View>
        </View>

        {/* Action buttons — pending only */}
        {showActions && (
          <View style={[cardStyles.actionRow, { borderTopColor: colors.outline + '25' }]}>
            <TouchableOpacity
              style={[cardStyles.actionBtn, cardStyles.rejectBtn]}
              onPress={() => onReject(visitor)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={14} color="#DC2626" />
              <Text style={cardStyles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cardStyles.actionBtn, cardStyles.approveBtn]}
              onPress={() => onApprove(visitor)}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark" size={14} color="#fff" />
              <Text style={cardStyles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* View pass button — approved / checked_in */}
        {showPass && (
          <TouchableOpacity
            style={[cardStyles.passBtn, { borderTopColor: colors.outline + '25' }]}
            onPress={() => onViewPass(visitor)}
            activeOpacity={0.7}
          >
            <Ionicons name="qr-code-outline" size={13} color={colors.primary} />
            <Text style={[cardStyles.passBtnText, { color: colors.primary }]}>View Visitor Pass</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Full-screen photo viewer */}
      <PhotoViewer
        visible={photoVisible}
        uri={visitor.photoUrl}
        name={visitor.name}
        onClose={() => setPhotoVisible(false)}
      />
    </View>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  content: {
    flex: 1,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  zoomBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    padding: 2,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '800',
  },
  nameBlock: {
    flex: 1,
    gap: 2,
  },
  visitorName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  visitorPhone: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  approveBtn: {
    backgroundColor: '#16A34A',
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  passBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  passBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

// ── Main Screen ────────────────────────────────────────────────────────────
export default function VisitorRequestsScreen() {
  const { colors } = useTheme();
  const user = useSelector(selectCurrentUser);

  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [qrModal, setQrModal] = useState(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const { data, isLoading, isError, error, refetch, isRefetching } = useVisitors();
  const approveMutation = useApproveVisitor();
  const rejectMutation = useRejectVisitor();
  const visitors = data?.data ?? [];

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const {
    control, handleSubmit, reset: resetRejectForm,
    formState: { errors: rejectErrors },
  } = useForm({
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

  const handleAndroidChange = useCallback((event, date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && date) setSelectedDate(date);
  }, []);

  const handleIosConfirm = useCallback((date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  }, []);

  const handleIosCancel = useCallback(() => {
    setShowDatePicker(false);
  }, []);

  const filteredVisitors = useMemo(() => {
    if (!selectedDate) return visitors;
    return visitors.filter((v) =>
      new Date(v.createdAt).toDateString() === selectedDate.toDateString()
    );
  }, [visitors, selectedDate]);

  const formattedSelectedDate = selectedDate
    ? selectedDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  // Stats for header
  const pendingCount = visitors.filter(v => v.status === 'pending').length;

  if (isError) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline + '30' }]}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Visitor Requests</Text>
        </View>
        <ErrorState
          error={error?.response?.data?.message ?? 'Failed to load visitors'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>

      {/* ── Compact Header (replaces Appbar.Header) ── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outline + '20' }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Visitor Requests</Text>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingCount} pending</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.dateFilterChip,
            {
              backgroundColor: selectedDate ? colors.primary + '15' : colors.background,
              borderColor: selectedDate ? colors.primary + '50' : colors.outline + '40',
            },
          ]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={selectedDate ? colors.primary : colors.onSurfaceVariant}
          />
          <Text style={[
            styles.dateFilterChipText,
            { color: selectedDate ? colors.primary : colors.onSurfaceVariant },
          ]}>
            {formattedSelectedDate ?? 'Filter'}
          </Text>
          {selectedDate && (
            <TouchableOpacity
              onPress={() => setSelectedDate(null)}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons name="close-circle" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* Android date picker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={selectedDate ?? new Date()}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleAndroidChange}
        />
      )}

      {/* iOS date picker modal */}
      {Platform.OS === 'ios' && (
        <IoDatePickerModal
          visible={showDatePicker}
          selectedDate={selectedDate}
          onConfirm={handleIosConfirm}
          onCancel={handleIosCancel}
          colors={colors}
        />
      )}

      {isLoading ? (
        <View style={{ paddingTop: 16 }}>
          <SkeletonList count={5} />
        </View>
      ) : (
        <FlatList
          data={filteredVisitors}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={selectedDate ? 'No visitors on this date' : 'No visitor requests'}
              subtitle={
                selectedDate
                  ? 'Try a different date.'
                  : 'Visitor requests from the guard will show up here.'
              }
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <VisitorRowCard
              visitor={item}
              onApprove={(v) => setApproveModal(v)}
              onReject={(v) => openRejectModal(v)}
              onViewPass={(v) => setQrModal(v)}
            />
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
        confirmColor="#16A34A"
        icon="checkmark-circle-outline"
        loading={approveMutation.isPending}
        onConfirm={handleApproveConfirm}
        onDismiss={() => !approveMutation.isPending && setApproveModal(null)}
      />

      {/* Reject modal */}
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
            Rejecting{' '}
            <Text style={{ fontWeight: '700', color: colors.onSurface }}>{rejectModal?.name}</Text>
            's request. Please give a reason.
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
            <AppButton
              label="Cancel"
              mode="outlined"
              onPress={() => setRejectModal(null)}
              style={{ flex: 1 }}
              disabled={rejectMutation.isPending}
            />
            <AppButton
              label="Reject"
              onPress={handleSubmit(handleRejectSubmit)}
              loading={rejectMutation.isPending}
              color="#DC2626"
              style={{ flex: 1 }}
            />
          </View>
        </PaperModal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: 14, paddingBottom: 32, flexGrow: 1 },

  // ── Compact header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,        // tight — SafeAreaView handles top inset
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },

  // ── Date filter chip (inline in header) ──
  dateFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  dateFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── iOS picker ──
  iosPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iosPickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  iosPickerTitle: { fontSize: 16, fontWeight: '700' },
  iosPickerAction: { fontSize: 15 },
  iosDatePicker: { alignSelf: 'center', width: '100%' },

  // ── Reject modal ──
  rejectModal: { margin: 20, borderRadius: 20, padding: 20 },
  rejectTitle: { fontWeight: '700', marginBottom: 6 },
  rejectActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
});