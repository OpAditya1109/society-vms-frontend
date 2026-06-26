// src/screens/resident/VehiclesScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal } from 'react-native';
import { Text, useTheme, Appbar, Surface, Divider, TextInput, Button, FAB, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { vehicleService } from '../../api/services';
import { QUERY_KEYS } from '../../constants';
import { EmptyState, LoadingScreen } from '../../components/common';

const VEHICLE_TYPES = ['car','motorcycle','scooter','bicycle','auto-rickshaw','van','other'];
const COLORS_LIST   = ['White','Black','Silver','Grey','Red','Blue','Green','Yellow','Orange','Brown','Other'];
const TYPE_CONFIG = {
  car:             { icon:'car-outline',       color:'#1565C0' },
  motorcycle:      { icon:'bicycle-outline',   color:'#E65100' },
  scooter:         { icon:'bicycle-outline',   color:'#6A1B9A' },
  bicycle:         { icon:'bicycle-outline',   color:'#2E7D32' },
  'auto-rickshaw': { icon:'car-sport-outline', color:'#F9A825' },
  van:             { icon:'bus-outline',       color:'#00838F' },
  other:           { icon:'car-outline',       color:'#757575' },
};
const EMPTY_FORM = { vehicleNumber:'', vehicleType:'car', model:'', color:'', parkingSlot:'', rcNumber:'', insuranceExpiry:'' };

function VehicleFormModal({ visible, vehicle, onClose, onSave, loading, colors }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  React.useEffect(() => {
    if (visible) setForm(vehicle ? { vehicleNumber:vehicle.vehicleNumber, vehicleType:vehicle.vehicleType, model:vehicle.model||'', color:vehicle.color||'', parkingSlot:vehicle.parkingSlot||'', rcNumber:vehicle.rcNumber||'', insuranceExpiry: vehicle.insuranceExpiry ? vehicle.insuranceExpiry.split('T')[0] : '' } : { ...EMPTY_FORM });
  }, [visible, vehicle]);
  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.sheet, { backgroundColor: colors.surface }]}>
          <View style={modalStyles.header}>
            <Text variant="titleMedium" style={{ fontWeight:'700', color: colors.onSurface }}>{vehicle ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.onSurfaceVariant} /></TouchableOpacity>
          </View>
          <Divider />
          <ScrollView contentContainerStyle={{ padding:16, gap:12 }} showsVerticalScrollIndicator={false}>
            <TextInput label="Vehicle Number *" mode="outlined" value={form.vehicleNumber} autoCapitalize="characters" placeholder="MH12AB1234" onChangeText={v => set('vehicleNumber', v.toUpperCase())} />
            <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>Vehicle Type *</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
              {VEHICLE_TYPES.map(t => <Chip key={t} selected={form.vehicleType===t} onPress={() => set('vehicleType', t)} compact>{t.charAt(0).toUpperCase()+t.slice(1)}</Chip>)}
            </View>
            <TextInput label="Model" mode="outlined" value={form.model} placeholder="e.g. Honda City" onChangeText={v => set('model', v)} />
            <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>Color</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
              {COLORS_LIST.map(c => <Chip key={c} selected={form.color===c} onPress={() => set('color', c)} compact>{c}</Chip>)}
            </View>
            <TextInput label="Parking Slot" mode="outlined" value={form.parkingSlot} placeholder="e.g. B-12" onChangeText={v => set('parkingSlot', v)} />
            <TextInput label="RC Number" mode="outlined" value={form.rcNumber} autoCapitalize="characters" onChangeText={v => set('rcNumber', v.toUpperCase())} />
            <TextInput label="Insurance Expiry (YYYY-MM-DD)" mode="outlined" value={form.insuranceExpiry} placeholder="2026-12-31" onChangeText={v => set('insuranceExpiry', v)} />
          </ScrollView>
          <View style={{ padding:16, gap:8 }}>
            <Button mode="contained" onPress={() => onSave(form)} loading={loading} disabled={!form.vehicleNumber || !form.vehicleType}>{vehicle ? 'Update Vehicle' : 'Add Vehicle'}</Button>
            <Button mode="outlined" onPress={onClose}>Cancel</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailItem({ icon, label, value, colors, accent, suffix='' }) {
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:8, width:'47%' }}>
      <View style={{ width:28, height:28, borderRadius:8, alignItems:'center', justifyContent:'center', backgroundColor:(accent||colors.primary)+'18' }}>
        <Ionicons name={icon} size={14} color={accent||colors.primary} />
      </View>
      <View style={{ flex:1 }}>
        <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, textTransform:'uppercase', fontSize:9 }}>{label}</Text>
        <Text variant="bodySmall" style={{ color: accent||colors.onSurface, fontWeight:'600' }}>{value}{suffix}</Text>
      </View>
    </View>
  );
}

function VehicleCard({ vehicle, colors, onEdit, onDelete }) {
  const cfg = TYPE_CONFIG[vehicle.vehicleType] || TYPE_CONFIG.other;
  const insExpiry = vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry) : null;
  const isExpiringSoon = insExpiry && (insExpiry - Date.now()) < 30*24*60*60*1000;
  const isExpired      = insExpiry && insExpiry < new Date();
  return (
    <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={2}>
      <View style={[styles.cardHeader, { backgroundColor: cfg.color+'12' }]}>
        <View style={[styles.vehicleIcon, { backgroundColor: cfg.color+'22' }]}>
          <Ionicons name={cfg.icon} size={28} color={cfg.color} />
        </View>
        <View style={{ flex:1, gap:3 }}>
          <Text variant="titleMedium" style={{ fontWeight:'800', color: colors.onSurface, letterSpacing:1 }}>{vehicle.vehicleNumber}</Text>
          <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap' }}>
            <View style={[styles.badge, { backgroundColor: cfg.color+'20' }]}><Text style={{ color: cfg.color, fontSize:11, fontWeight:'700', textTransform:'capitalize' }}>{vehicle.vehicleType}</Text></View>
            {vehicle.color && <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}><Text style={{ color: colors.onSurfaceVariant, fontSize:11, fontWeight:'600' }}>{vehicle.color}</Text></View>}
          </View>
        </View>
        <View style={{ gap:8 }}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.primaryContainer }]} onPress={() => onEdit(vehicle)}><Ionicons name="pencil-outline" size={16} color={colors.primary} /></TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor:'#FDECEA' }]} onPress={() => onDelete(vehicle)}><Ionicons name="trash-outline" size={16} color="#C62828" /></TouchableOpacity>
        </View>
      </View>
      <View style={{ flexDirection:'row', flexWrap:'wrap', padding:12, gap:8 }}>
        {vehicle.model        && <DetailItem icon="information-circle-outline" label="Model"           value={vehicle.model}                                colors={colors} />}
        {vehicle.parkingSlot  && <DetailItem icon="location-outline"           label="Parking Slot"    value={vehicle.parkingSlot}                          colors={colors} accent="#1565C0" />}
        {vehicle.rcNumber     && <DetailItem icon="document-outline"           label="RC Number"       value={vehicle.rcNumber}                             colors={colors} />}
        {insExpiry            && <DetailItem icon="shield-checkmark-outline"   label="Insurance Expiry" value={insExpiry.toLocaleDateString('en-IN')}       colors={colors} accent={isExpired?'#C62828':isExpiringSoon?'#F9A825':undefined} suffix={isExpired?' (EXPIRED)':isExpiringSoon?' (Expiring Soon)':''} />}
      </View>
    </Surface>
  );
}

export default function VehiclesScreen({ navigation }) {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeType, setActiveType] = useState('all');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.VEHICLES,
    queryFn: () => vehicleService.getAll().then(r => r.data.data),
  });

  const addMutation    = useMutation({ mutationFn: vehicleService.add,                             onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.VEHICLES }); setModalVisible(false); }, onError: (e) => Alert.alert('Error', e.response?.data?.message||'Failed') });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => vehicleService.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.VEHICLES }); setModalVisible(false); setEditing(null); }, onError: (e) => Alert.alert('Error', e.response?.data?.message||'Failed') });
  const deleteMutation = useMutation({ mutationFn: vehicleService.remove,                          onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.VEHICLES }), onError: (e) => Alert.alert('Error', e.response?.data?.message||'Failed') });

  const handleSave = (form) => {
    const p = { ...form };
    if (!p.model) delete p.model; if (!p.color) delete p.color; if (!p.parkingSlot) delete p.parkingSlot;
    if (!p.rcNumber) delete p.rcNumber; if (!p.insuranceExpiry) delete p.insuranceExpiry;
    editing ? updateMutation.mutate({ id: editing._id, data:p }) : addMutation.mutate(p);
  };
  const handleDelete = (v) => Alert.alert('Remove', `Remove ${v.vehicleNumber}?`, [{ text:'Cancel', style:'cancel' }, { text:'Remove', style:'destructive', onPress: () => deleteMutation.mutate(v._id) }]);

  if (isLoading) return <LoadingScreen />;
  const all      = data || [];
  const types    = ['all', ...new Set(all.map(v => v.vehicleType))];
  const filtered = activeType === 'all' ? all : all.filter(v => v.vehicleType === activeType);

  return (
    <SafeAreaView  edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="My Vehicles" titleStyle={{ fontWeight:'700' }} />
        <Appbar.Action icon="plus" onPress={() => { setEditing(null); setModalVisible(true); }} />
      </Appbar.Header>

      {all.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight:56 }} contentContainerStyle={{ paddingHorizontal:16, paddingVertical:10, gap:8 }}>
          {types.map(t => <Chip key={t} selected={activeType===t} onPress={() => setActiveType(t)} compact>{t==='all'?'All':t.charAt(0).toUpperCase()+t.slice(1)}</Chip>)}
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={[styles.scroll, filtered.length===0 && { flex:1 }]} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <EmptyState icon="car-outline" title="No Vehicles Registered" message="Register your vehicles for easy gate entry and parking slot management." />
        ) : (
          <>
            <View style={[styles.statsBar, { backgroundColor: colors.primaryContainer+'60' }]}>
              <Ionicons name="car" size={16} color={colors.primary} />
              <Text variant="labelMedium" style={{ color: colors.primary, marginLeft:6, fontWeight:'600' }}>{filtered.length} vehicle{filtered.length!==1?'s':''} registered</Text>
            </View>
            {filtered.map(v => <VehicleCard key={v._id} vehicle={v} colors={colors} onEdit={(v) => { setEditing(v); setModalVisible(true); }} onDelete={handleDelete} />)}
          </>
        )}
      </ScrollView>

      <FAB icon="plus" style={[styles.fab, { backgroundColor: colors.primary }]} color={colors.onPrimary} onPress={() => { setEditing(null); setModalVisible(true); }} />
      <VehicleFormModal visible={modalVisible} vehicle={editing} onClose={() => { setModalVisible(false); setEditing(null); }} onSave={handleSave} loading={addMutation.isPending || updateMutation.isPending} colors={colors} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex:1 }, scroll: { padding:16, paddingBottom:100, gap:12 },
  statsBar: { flexDirection:'row', alignItems:'center', padding:10, borderRadius:10, marginBottom:4 },
  card: { borderRadius:18, overflow:'hidden' },
  cardHeader: { flexDirection:'row', alignItems:'center', gap:12, padding:14 },
  vehicleIcon: { width:54, height:54, borderRadius:16, alignItems:'center', justifyContent:'center' },
  badge: { paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  iconBtn: { width:32, height:32, borderRadius:10, alignItems:'center', justifyContent:'center' },
  fab: { position:'absolute', right:20, bottom:24 },
});
const modalStyles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  sheet: { borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'92%' },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:18, paddingBottom:12 },
});