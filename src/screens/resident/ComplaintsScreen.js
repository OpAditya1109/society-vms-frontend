// src/screens/resident/ComplaintsScreen.js
import React, { useState } from 'react';
import {
  View, ScrollView, FlatList, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import {
  Text, useTheme, Appbar, Modal, Portal, Divider, SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useComplaints, useCreateComplaint } from '../../hooks/useComplaints';
import ComplaintCard from '../../components/resident/ComplaintCard';
import { SkeletonList } from '../../components/resident/SkeletonCard';
import { EmptyState, ErrorState, AppButton, AppInput } from '../../components/common';
import { COMPLAINT_CATEGORIES } from '../../constants';

// ── Zod schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Please select a category'),
});

const CATEGORY_OPTIONS = COMPLAINT_CATEGORIES.map((c) => ({
  value: c,
  label: c.charAt(0).toUpperCase() + c.slice(1),
}));

export default function ComplaintsScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState('history'); // 'new' | 'history'
  const [formModal, setFormModal] = useState(false);

  const { data, isLoading, isError, error, refetch } = useComplaints({ limit: 50 });
  const createMutation = useCreateComplaint();

  const complaints = data?.data ?? [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', category: 'other' },
  });

  const onSubmit = (values) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        reset();
        setFormModal(false);
      },
    });
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.Content title="Complaints" titleStyle={{ fontWeight: '700' }} />
        <Appbar.Action icon="plus" onPress={() => setFormModal(true)} />
      </Appbar.Header>

      {/* Segment */}
      <View style={styles.segmentWrap}>
        <SegmentedButtons
          value={tab}
          onValueChange={setTab}
          buttons={[
            { value: 'history', label: 'My Complaints', icon: 'format-list-bulleted' },
            { value: 'new',     label: 'New Complaint', icon: 'plus-circle-outline' },
          ]}
        />
      </View>

      {/* New Complaint Form inline */}
      {tab === 'new' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            <ComplaintForm
              control={control}
              errors={errors}
              onSubmit={handleSubmit(onSubmit)}
              loading={createMutation.isPending}
              colors={colors}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* History */}
      {tab === 'history' && (
        <>
          {isError ? (
            <ErrorState
              error={error?.response?.data?.message ?? 'Failed to load complaints'}
              onRetry={refetch}
            />
          ) : isLoading ? (
            <View style={{ paddingTop: 16 }}>
              <SkeletonList count={4} />
            </View>
          ) : (
            <FlatList
              data={complaints}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <EmptyState
                  icon="alert-circle-outline"
                  title="No complaints yet"
                  subtitle="Tap + to file a new complaint."
                />
              }
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => <ComplaintCard complaint={item} />}
            />
          )}
        </>
      )}

      {/* New Complaint Modal (accessible via Appbar + button) */}
      <Portal>
        <Modal
          visible={formModal}
          onDismiss={() => !createMutation.isPending && setFormModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text variant="titleMedium" style={[styles.modalTitle, { color: colors.onSurface }]}>
                New Complaint
              </Text>
              <Divider style={{ marginBottom: 16 }} />
              <ComplaintForm
                control={control}
                errors={errors}
                onSubmit={handleSubmit(onSubmit)}
                loading={createMutation.isPending}
                colors={colors}
                onCancel={() => { reset(); setFormModal(false); }}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

// ── Inline reusable form component ───────────────────────────────────────────
function ComplaintForm({ control, errors, onSubmit, loading, colors, onCancel }) {
  return (
    <View style={formStyles.container}>
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value } }) => (
          <AppInput
            label="Complaint Title"
            value={value}
            onChangeText={onChange}
            error={errors.title?.message}
            placeholder="e.g. Water leakage in bathroom"
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <AppInput
            label="Description"
            value={value}
            onChangeText={onChange}
            multiline
            numberOfLines={4}
            error={errors.description?.message}
            placeholder="Describe the issue in detail..."
          />
        )}
      />

      <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant, marginBottom: 6 }}>
        Category
      </Text>
      <Controller
        control={control}
        name="category"
        render={({ field: { onChange, value } }) => (
          <View style={formStyles.categoryGrid}>
            {COMPLAINT_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  formStyles.catChip,
                  {
                    backgroundColor:
                      value === cat ? colors.primary + '18' : colors.surfaceVariant,
                    borderColor: value === cat ? colors.primary : colors.outlineVariant,
                  },
                ]}
                onPress={() => onChange(cat)}
                activeOpacity={0.7}
              >
                <Text
                  variant="labelSmall"
                  style={{
                    color: value === cat ? colors.primary : colors.onSurfaceVariant,
                    fontWeight: value === cat ? '700' : '400',
                  }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
      {errors.category && (
        <Text variant="bodySmall" style={{ color: colors.error, marginTop: 4 }}>
          {errors.category.message}
        </Text>
      )}

      <View style={formStyles.actions}>
        {onCancel && (
          <AppButton
            label="Cancel"
            mode="outlined"
            onPress={onCancel}
            style={{ flex: 1 }}
            disabled={loading}
          />
        )}
        <AppButton
          label="Submit Complaint"
          onPress={onSubmit}
          loading={loading}
          style={{ flex: 2 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  segmentWrap: { paddingHorizontal: 16, paddingVertical: 12 },
  list: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  formScroll: { padding: 16, paddingBottom: 32 },
  modal: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: { fontWeight: '700', marginBottom: 12 },
});

const formStyles = StyleSheet.create({
  container: { gap: 14 },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
});