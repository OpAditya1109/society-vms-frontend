// src/screens/admin/NoticesManagementScreen.js
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import {
  Text, useTheme, Appbar, Modal, Portal, Divider, SegmentedButtons, Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

import { useNotices } from '../../hooks/useNotices';
import { noticeService } from '../../api/services/noticeService';
import { QUERY_KEYS, NOTICE_TYPE } from '../../constants';
import AdminNoticeCard from '../../components/admin/AdminNoticeCard';
import ConfirmationModal from '../../components/resident/ConfirmationModal';
import { SkeletonList } from '../../components/resident/SkeletonCard';
import { EmptyState, ErrorState, AppButton, AppInput } from '../../components/common';

const ADMIN_ACCENT = '#4A148C';

const noticeSchema = z.object({
  title:   z.string().min(5, 'Title must be at least 5 characters').max(200),
  content: z.string().min(10, 'Description must be at least 10 characters'),
  type:    z.string().min(1, 'Please select a type'),
});

const TYPE_OPTIONS = [
  { value: NOTICE_TYPE.GENERAL,     label: 'General' },
  { value: NOTICE_TYPE.MAINTENANCE, label: 'Maintenance' },
  { value: NOTICE_TYPE.EMERGENCY,   label: 'Emergency' },
  { value: NOTICE_TYPE.EVENT,       label: 'Event' },
];

// Type filter config (includes "All")
const FILTER_OPTIONS = [
  { value: 'all',                   label: 'All',         icon: 'list-outline',              color: ADMIN_ACCENT },
  { value: NOTICE_TYPE.GENERAL,     label: 'General',     icon: 'information-circle-outline', color: '#1565C0' },
  { value: NOTICE_TYPE.MAINTENANCE, label: 'Maintenance', icon: 'construct-outline',          color: '#E65100' },
  { value: NOTICE_TYPE.EMERGENCY,   label: 'Emergency',   icon: 'warning-outline',            color: '#C62828' },
  { value: NOTICE_TYPE.EVENT,       label: 'Event',       icon: 'calendar-outline',           color: '#2E7D32' },
];

export default function NoticesManagementScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [formVisible, setFormVisible]               = useState(false);
  const [editTarget, setEditTarget]                 = useState(null);   // notice being edited
  const [deleteTarget, setDeleteTarget]             = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [activeFilter, setActiveFilter]             = useState('all');  // type filter

  const { data, isLoading, isError, error, refetch, isRefetching } = useNotices({ limit: 50 });
  const notices = data?.data ?? [];

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filteredNotices = useMemo(() => {
    if (activeFilter === 'all') return notices;
    return notices.filter((n) => n.type === activeFilter);
  }, [notices, activeFilter]);

  // ── Create mutation ──────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload) => noticeService.createNotice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTICES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD('admin') });
      Toast.show({ type: 'success', text1: 'Notice Created', text2: 'Notice published to residents.' });
      closeForm();
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message ?? 'Failed to create notice.' });
    },
  });

  // ── Edit mutation ────────────────────────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: ({ id, payload }) => noticeService.updateNotice(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTICES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD('admin') });
      Toast.show({ type: 'success', text1: 'Notice Updated' });
      closeForm();
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message ?? 'Failed to update notice.' });
    },
  });

  // ── Delete mutation ──────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => noticeService.deleteNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTICES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD('admin') });
      Toast.show({ type: 'success', text1: 'Notice Deleted' });
      setDeleteModalVisible(false);
      setDeleteTarget(null);
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message ?? 'Failed to delete notice.' });
    },
  });

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(noticeSchema),
    defaultValues: { title: '', content: '', type: NOTICE_TYPE.GENERAL },
  });

  const selectedType   = watch('type');
  const isMutating     = createMutation.isPending || editMutation.isPending;
  const isEditMode     = !!editTarget;

  const openCreateForm = () => {
    setEditTarget(null);
    reset({ title: '', content: '', type: NOTICE_TYPE.GENERAL });
    setFormVisible(true);
  };

  const openEditForm = useCallback((notice) => {
    setEditTarget(notice);
    reset({ title: notice.title, content: notice.content, type: notice.type });
    setFormVisible(true);
  }, [reset]);

  const closeForm = () => {
    setFormVisible(false);
    setEditTarget(null);
    reset();
  };

  const onSubmit = (values) => {
    if (isEditMode) {
      editMutation.mutate({ id: editTarget._id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const onDeletePress = useCallback((notice) => {
    setDeleteTarget(notice);
    setDeleteModalVisible(true);
  }, []);

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.Content title="Notices" titleStyle={{ fontWeight: '700' }} />
        <Appbar.Action icon="plus" onPress={openCreateForm} />
      </Appbar.Header>

      {/* ── Type filter chips ──────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTER_OPTIONS.map((opt) => {
          const active = activeFilter === opt.value;
          return (
            <Chip
              key={opt.value}
              selected={active}
              onPress={() => setActiveFilter(opt.value)}
              icon={() => (
                <Ionicons
                  name={opt.icon}
                  size={13}
                  color={active ? '#fff' : opt.color}
                />
              )}
              style={[
                styles.filterChip,
                { backgroundColor: active ? opt.color : opt.color + '18' },
              ]}
              textStyle={{
                color: active ? '#fff' : opt.color,
                fontSize: 12,
                fontWeight: '700',
              }}
            >
              {opt.label}
            </Chip>
          );
        })}
      </ScrollView>

      {/* ── Notice list ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <SkeletonList count={5} />
      ) : isError ? (
        <ErrorState
          error={error?.response?.data?.message ?? 'Failed to load notices'}
          onRetry={refetch}
        />
      ) : (
        <FlatList
          data={filteredNotices}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <AdminNoticeCard
              notice={item}
              onEdit={() => openEditForm(item)}
              onDelete={() => onDeletePress(item)}
              deleteLoading={deleteMutation.isPending && deleteTarget?._id === item._id}
            />
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
              icon="newspaper-outline"
              title={activeFilter === 'all' ? 'No notices yet' : `No ${activeFilter} notices`}
              subtitle={
                activeFilter === 'all'
                  ? 'Create the first notice for your society.'
                  : `No notices of type "${activeFilter}" found.`
              }
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Create / Edit Notice Modal ─────────────────────────────────────── */}
      <Portal>
        <Modal
          visible={formVisible}
          onDismiss={() => { if (!isMutating) closeForm(); }}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Text variant="titleMedium" style={[styles.modalTitle, { color: colors.onSurface }]}>
              {isEditMode ? 'Edit Notice' : 'Create Notice'}
            </Text>
            <Divider style={{ marginBottom: 16 }} />

            {/* Type selector */}
            <Text variant="labelSmall" style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
              NOTICE TYPE
            </Text>
            <SegmentedButtons
              value={selectedType}
              onValueChange={(v) => setValue('type', v)}
              buttons={TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              style={{ marginBottom: 14 }}
            />

            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="Title *"
                  value={value}
                  onChangeText={onChange}
                  error={errors.title?.message}
                  left="text-short"
                  autoCapitalize="sentences"
                />
              )}
            />

            <Controller
              control={control}
              name="content"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="Description *"
                  value={value}
                  onChangeText={onChange}
                  error={errors.content?.message}
                  left="text-long"
                  multiline
                  numberOfLines={4}
                  autoCapitalize="sentences"
                />
              )}
            />

            <View style={styles.modalActions}>
              <AppButton
                label="Cancel"
                mode="outlined"
                onPress={closeForm}
                disabled={isMutating}
                style={{ flex: 1 }}
              />
              <AppButton
                label={isEditMode ? 'Update' : 'Publish'}
                onPress={handleSubmit(onSubmit)}
                loading={isMutating}
                color={ADMIN_ACCENT}
                style={{ flex: 1 }}
              />
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>

      {/* ── Delete Confirmation ────────────────────────────────────────────── */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Notice"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor={colors.error}
        icon="trash-outline"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget?._id)}
        onDismiss={() => { if (!deleteMutation.isPending) { setDeleteModalVisible(false); setDeleteTarget(null); } }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterChip: {
    borderRadius: 20,
  },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 },
  modal: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: { fontWeight: '700', marginBottom: 12 },
  fieldLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
});