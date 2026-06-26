// src/screens/resident/PreApprovedScreen.js
import React, { useState } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  Modal, Alert, TextInput,
} from 'react-native';
import { Text, useTheme, Appbar, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { usePreApproved, useAddPreApproved, useRemovePreApproved, useUpdatePreApproved } from '../../hooks/usePreApproved';
import { EmptyState, ErrorState } from '../../components/common';

const CATEGORIES = [
  { key: 'maid',    label: 'Maid',     icon: 'home-outline',       color: '#9C27B0' },
  { key: 'driver',  label: 'Driver',   icon: 'car-outline',        color: '#1565C0' },
  { key: 'courier', label: 'Courier',  icon: 'cube-outline',       color: '#E65100' },
  { key: 'cook',    label: 'Cook',     icon: 'restaurant-outline', color: '#2E7D32' },
  { key: 'nurse',   label: 'Nurse',    icon: 'medkit-outline',     color: '#C62828' },
  { key: 'vendor',  label: 'Vendor',   icon: 'bag-outline',        color: '#F9A825' },
  { key: 'other',   label: 'Other',    icon: 'account-outline',     color: '#607D8B' },
];

const getCat = (key) => CATEGORIES.find(c => c.key === key) ?? CATEGORIES[6];

function CategoryPill({ cat, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.catPill, selected && { backgroundColor: cat.color + '22', borderColor: cat.color }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name={cat.icon} size={16} color={selected ? cat.color : '#9E9E9E'} />
      <Text style={[styles.catPillText, { color: selected ? cat.color : '#9E9E9E' }]}>{cat.label}</Text>
    </TouchableOpacity>
  );
}

function EntryCard({ entry, onDelete, onToggle }) {
  const cat = getCat(entry.category);
  return (
    <Surface style={[styles.card, !entry.isActive && styles.cardInactive]} elevation={2}>
      <View style={[styles.catIcon, { backgroundColor: cat.color + '18' }]}>
        <Ionicons name={cat.icon} size={22} color={cat.color} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{entry.name}</Text>
        <Text style={styles.cardMobile}>{entry.mobile}</Text>
        {!!entry.notes && <Text style={styles.cardNotes} numberOfLines={1}>{entry.notes}</Text>}
        <View style={[styles.catBadge, { backgroundColor: cat.color + '18' }]}>
          <Text style={[styles.catBadgeText, { color: cat.color }]}>{cat.label}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: entry.isActive ? '#E8F5E9' : '#F5F5F5' }]}
          onPress={() => onToggle(entry)}
        >
          <Ionicons name={entry.isActive ? 'checkmark-circle' : 'close-circle'} size={20} color={entry.isActive ? '#2E7D32' : '#9E9E9E'} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#FFEBEE' }]} onPress={() => onDelete(entry._id)}>
          <Ionicons name="trash-outline" size={18} color="#C62828" />
        </TouchableOpacity>
      </View>
    </Surface>
  );
}

function AddModal({ visible, onClose, onSave, loading }) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [category, setCategory] = useState('other');
  const [notes, setNotes] = useState('');

  const reset = () => { setName(''); setMobile(''); setCategory('other'); setNotes(''); };

  const handleSave = () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required');
    if (!/^[6-9]\d{9}$/.test(mobile)) return Alert.alert('Error', 'Enter a valid 10-digit mobile number');
    onSave({ name: name.trim(), mobile, category, notes: notes.trim() });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Add to Whitelist</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Name *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.outlineVariant, color: colors.onSurface }]}
            placeholder="Full name" placeholderTextColor="#9E9E9E"
            value={name} onChangeText={setName}
          />

          <Text style={styles.inputLabel}>Mobile *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.outlineVariant, color: colors.onSurface }]}
            placeholder="10-digit mobile" placeholderTextColor="#9E9E9E"
            value={mobile} onChangeText={setMobile} keyboardType="phone-pad" maxLength={10}
          />

          <Text style={styles.inputLabel}>Category</Text>
          <View style={styles.catRow}>
            {CATEGORIES.map(cat => (
              <CategoryPill key={cat.key} cat={cat} selected={category === cat.key} onPress={() => setCategory(cat.key)} />
            ))}
          </View>

          <Text style={styles.inputLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.outlineVariant, color: colors.onSurface }]}
            placeholder="e.g. Mon–Fri mornings" placeholderTextColor="#9E9E9E"
            value={notes} onChangeText={setNotes}
          />

          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.6 }]}
            onPress={handleSave} disabled={loading}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>{loading ? 'Adding…' : 'Add to Whitelist'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function PreApprovedScreen({ navigation }) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const { data, isLoading, isError, error, refetch } = usePreApproved();
  const addMutation    = useAddPreApproved();
  const removeMutation = useRemovePreApproved();
  const updateMutation = useUpdatePreApproved();

  const list = data?.data ?? [];

  const handleDelete = (id) => {
    Alert.alert('Remove from Whitelist', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeMutation.mutate(id) },
    ]);
  };

  const handleToggle = (entry) => {
    updateMutation.mutate({ id: entry._id, isActive: !entry.isActive });
  };

  if (isError) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
        <Appbar.Header style={{ backgroundColor: colors.surface }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Pre-Approved Visitors" titleStyle={{ fontWeight: '700' }} />
        </Appbar.Header>
        <ErrorState error={error?.response?.data?.message ?? 'Failed to load'} onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: '#F8F9FB' }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Pre-Approved Visitors" titleStyle={{ fontWeight: '700' }} />
        <Appbar.Action icon="plus" onPress={() => setModalVisible(true)} />
      </Appbar.Header>

      <View style={styles.infoBar}>
        <Ionicons name="information-circle-outline" size={16} color="#1565C0" />
        <Text style={styles.infoText}>
          Whitelisted visitors are auto-approved when the guard enters their mobile number.
        </Text>
      </View>

      <FlatList
        data={list}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          !isLoading && (
            <EmptyState
              icon="shield-checkmark-outline"
              title="No pre-approved visitors"
              subtitle="Add your maid, driver, or other frequent guests to skip the approval step."
            />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <EntryCard entry={item} onDelete={handleDelete} onToggle={handleToggle} />
        )}
        ListFooterComponent={
          list.length > 0 ? (
            <TouchableOpacity style={styles.addMoreBtn} onPress={() => setModalVisible(true)}>
              <Ionicons name="add-circle-outline" size={20} color="#1565C0" />
              <Text style={styles.addMoreText}>Add Another Person</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <AddModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={(payload) => {
          addMutation.mutate(payload, { onSuccess: () => setModalVisible(false) });
        }}
        loading={addMutation.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  infoText: { flex: 1, fontSize: 12, color: '#1565C0', lineHeight: 18 },
  list: { padding: 16, paddingBottom: 40, flexGrow: 1 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#fff',
  },
  cardInactive: { opacity: 0.5 },
  catIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  cardMobile: { fontSize: 13, color: '#555' },
  cardNotes: { fontSize: 12, color: '#9E9E9E', fontStyle: 'italic' },
  catBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  catBadgeText: { fontSize: 11, fontWeight: '700' },
  cardActions: { gap: 6 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  addMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 16, paddingVertical: 12,
    borderWidth: 1.5, borderColor: '#1565C0', borderRadius: 14, borderStyle: 'dashed',
  },
  addMoreText: { color: '#1565C0', fontWeight: '600', fontSize: 14 },

  // Modal / Sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 15,
  },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E0E0E0',
  },
  catPillText: { fontSize: 12, fontWeight: '600' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 20, paddingVertical: 14, borderRadius: 14, backgroundColor: '#1565C0',
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});