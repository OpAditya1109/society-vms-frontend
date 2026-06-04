// src/screens/admin/ComplaintsManagementScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl,
} from 'react-native';
import {
  Text, useTheme, Appbar, Modal, Portal, Divider, RadioButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { useComplaints } from '../../hooks/useComplaints';
import { complaintService } from '../../api/services/complaintService';
import { QUERY_KEYS, COMPLAINT_STATUS } from '../../constants';
import AdminComplaintCard from '../../components/admin/AdminComplaintCard';
import ConfirmationModal from '../../components/resident/ConfirmationModal';
import { SkeletonList } from '../../components/resident/SkeletonCard';
import { EmptyState, ErrorState, AppButton } from '../../components/common';

const ADMIN_ACCENT = '#4A148C';

const STATUS_OPTIONS = [
  { value: COMPLAINT_STATUS.OPEN,        label: 'Open' },
  { value: COMPLAINT_STATUS.IN_PROGRESS, label: 'In Progress' },
  { value: COMPLAINT_STATUS.RESOLVED,    label: 'Resolved' },
  { value: COMPLAINT_STATUS.CLOSED,      label: 'Closed' },
];

export default function ComplaintsManagementScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus]                 = useState('');
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible]         = useState(false);

  const { data, isLoading, isError, error, refetch, isRefetching } = useComplaints({ limit: 50 });
  const complaints = data?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => complaintService.updateComplaintStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMPLAINTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD('admin') });
      Toast.show({ type: 'success', text1: 'Status Updated', text2: 'Complaint status has been updated.' });
      setConfirmVisible(false);
      setStatusModalVisible(false);
      setSelectedComplaint(null);
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message ?? 'Failed to update status.' });
    },
  });

  const onUpdateStatus = useCallback((complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setStatusModalVisible(true);
  }, []);

  const onStatusNext = () => {
    if (!newStatus || newStatus === selectedComplaint?.status) {
      Toast.show({ type: 'info', text1: 'No Change', text2: 'Please select a different status.' });
      return;
    }
    setStatusModalVisible(false);
    setConfirmVisible(true);
  };

  const onConfirmUpdate = () => {
    updateMutation.mutate({ id: selectedComplaint._id, status: newStatus });
  };

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const dismissStatusModal = () => {
    if (!updateMutation.isPending) {
      setStatusModalVisible(false);
      setSelectedComplaint(null);
    }
  };

  const dismissConfirm = () => {
    if (!updateMutation.isPending) {
      setConfirmVisible(false);
      setStatusModalVisible(true); // go back
    }
  };

  const statusLabel = STATUS_OPTIONS.find((s) => s.value === newStatus)?.label ?? newStatus;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.Content title="Complaints" titleStyle={{ fontWeight: '700' }} />
      </Appbar.Header>

      {isLoading ? (
        <SkeletonList count={5} />
      ) : isError ? (
        <ErrorState
          error={error?.response?.data?.message ?? 'Failed to load complaints'}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <AdminComplaintCard complaint={item} onUpdateStatus={onUpdateStatus} />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              colors={[ADMIN_ACCENT]}
              tintColor={ADMIN_ACCENT}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="alert-circle-outline"
              title="No complaints"
              subtitle="Resident complaints will appear here."
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Status Picker Modal */}
      <Portal>
        <Modal
          visible={statusModalVisible}
          onDismiss={dismissStatusModal}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <Text variant="titleMedium" style={[styles.modalTitle, { color: colors.onSurface }]}>
            Update Status
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginBottom: 16 }}>
            {selectedComplaint?.title}
          </Text>
          <Divider style={{ marginBottom: 16 }} />

          <RadioButton.Group value={newStatus} onValueChange={setNewStatus}>
            {STATUS_OPTIONS.map((opt) => (
              <RadioButton.Item
                key={opt.value}
                label={opt.label}
                value={opt.value}
                labelStyle={{ fontWeight: '600', color: colors.onSurface }}
              />
            ))}
          </RadioButton.Group>

          <View style={styles.modalActions}>
            <AppButton
              label="Cancel"
              mode="outlined"
              onPress={dismissStatusModal}
              style={{ flex: 1 }}
            />
            <AppButton
              label="Next"
              onPress={onStatusNext}
              color={ADMIN_ACCENT}
              style={{ flex: 1 }}
            />
          </View>
        </Modal>
      </Portal>

      {/* Confirm Update */}
      <ConfirmationModal
        visible={confirmVisible}
        title="Confirm Status Update"
        message={`Change status to "${statusLabel}" for this complaint?`}
        confirmLabel="Update"
        confirmColor={ADMIN_ACCENT}
        icon="refresh-outline"
        loading={updateMutation.isPending}
        onConfirm={onConfirmUpdate}
        onDismiss={dismissConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  modal: { margin: 20, borderRadius: 20, padding: 24 },
  modalTitle: { fontWeight: '700', marginBottom: 4 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
});