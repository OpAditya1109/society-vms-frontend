// src/screens/resident/DailyHelpScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal } from 'react-native';
import { Text, useTheme, Appbar, Surface, Avatar, Divider, TextInput, Button, FAB, Chip, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { dailyHelpService } from '../../api/services';
import { QUERY_KEYS } from '../../constants';
import { EmptyState, LoadingScreen } from '../../components/common';

const HELP_TYPES = ['maid','cook','driver','nanny','watchman','gardener','other'];
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_SHORT = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };
const TYPE_CONFIG = {
  maid:     { icon:'home-outline',       color:'#9C27B0' },
  cook:     { icon:'restaurant-outline', color:'#FF5722' },
  driver:   { icon:'car-outline',        color:'#2196F3' },
  nanny:    { icon:'happy-outline',      color:'#E91E63' },
  watchman: { icon:'shield-outline',     color:'#607D8B' },
  gardener: { icon:'leaf-outline',       color:'#4CAF50' },
  other:    { icon:'person-outline',     color:'#757575' },
};
const ATT_COLORS = { present:'#2E7D32', absent:'#C62828', 'half-day':'#F9A825' };
const EMPTY_FORM = { name:'', helpType:'maid', phone:'', aadhaar:'', photoUrl:'', workingDays:['monday','tuesday','wednesday','thursday','friday','saturday'], workTimings:{ startTime:'08:00', endTime:'10:00' } };

// ── Attendance Modal ──────────────────────────────────────────────────────────
function AttendanceModal({ visible, help, onClose, colors }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [status, setStatus] = useState('present');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [note, setNote] = useState('');
  const month = new Date().getMonth() + 1;
  const year  = new Date().getFullYear();

  const { data: attData } = useQuery({
    queryKey: QUERY_KEYS.ATTENDANCE(help?._id, month, year),
    queryFn: () => dailyHelpService.getAttendance(help._id, month, year).then(r => r.data.data),
    enabled: !!help,
  });

  const markMutation = useMutation({
    mutationFn: (payload) => dailyHelpService.markAttendance(help._id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.ATTENDANCE(help._id, month, year) }); Alert.alert('Done', 'Attendance marked!'); },
    onError: (e) => Alert.alert('Error', e.response?.data?.message || 'Failed'),
  });

  if (!help) return null;
  const att = attData?.attendance || [];
  const presentCount = att.filter(a => a.status==='present').length;
  const absentCount  = att.filter(a => a.status==='absent').length;
  const halfCount    = att.filter(a => a.status==='half-day').length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.sheet, { backgroundColor: colors.surface }]}>
          <View style={modalStyles.header}>
            <Text variant="titleMedium" style={{ fontWeight:'700', color: colors.onSurface }}>Attendance — {help.name}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.onSurfaceVariant} /></TouchableOpacity>
          </View>
          <Divider />
          <ScrollView contentContainerStyle={{ padding:16, gap:14 }} showsVerticalScrollIndicator={false}>
            {/* Summary */}
            <View style={{ flexDirection:'row', gap:10 }}>
              {[{ label:'Present', count:presentCount, color:'#2E7D32' }, { label:'Absent', count:absentCount, color:'#C62828' }, { label:'Half Day', count:halfCount, color:'#F9A825' }].map(s => (
                <View key={s.label} style={{ flex:1, borderRadius:14, padding:14, alignItems:'center', backgroundColor: s.color+'18', borderWidth:1, borderColor: s.color+'40' }}>
                  <Text style={{ color: s.color, fontWeight:'800', fontSize:22 }}>{s.count}</Text>
                  <Text style={{ color: s.color, fontWeight:'600', fontSize:11 }}>{s.label}</Text>
                </View>
              ))}
            </View>
            {/* Recent */}
            {att.length > 0 && (
              <Surface style={{ borderRadius:14, padding:12 }} elevation={1}>
                <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant, marginBottom:10, textTransform:'uppercase', letterSpacing:0.5 }}>This Month</Text>
                {[...att].reverse().slice(0,10).map((a, i) => (
                  <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:10, paddingVertical:6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor:'#e0e0e0' }}>
                    <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, width:80 }}>{new Date(a.date).toLocaleDateString('en-IN',{ day:'2-digit', month:'short' })}</Text>
                    <View style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:10, backgroundColor: ATT_COLORS[a.status]+'20' }}>
                      <Text style={{ color: ATT_COLORS[a.status], fontSize:12, fontWeight:'600', textTransform:'capitalize' }}>{a.status}</Text>
                    </View>
                    {a.checkInTime ? <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>{a.checkInTime}{a.checkOutTime ? ` – ${a.checkOutTime}` : ''}</Text> : null}
                  </View>
                ))}
              </Surface>
            )}
            {/* Mark today */}
            <Surface style={{ borderRadius:14, padding:14 }} elevation={1}>
              <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant, marginBottom:10, textTransform:'uppercase', letterSpacing:0.5 }}>Mark Today ({today})</Text>
              <SegmentedButtons value={status} onValueChange={setStatus}
                buttons={[
                  { value:'present',  label:'Present',  style: status==='present'  ? { backgroundColor:'#2E7D32' } : {} },
                  { value:'absent',   label:'Absent',   style: status==='absent'   ? { backgroundColor:'#C62828' } : {} },
                  { value:'half-day', label:'Half Day', style: status==='half-day' ? { backgroundColor:'#F9A825' } : {} },
                ]}
                style={{ marginBottom:12 }}
              />
              <View style={{ flexDirection:'row', gap:10, marginBottom:10 }}>
                <TextInput label="Check In" mode="outlined" placeholder="08:00" value={checkIn} onChangeText={setCheckIn} style={{ flex:1 }} dense />
                <TextInput label="Check Out" mode="outlined" placeholder="10:00" value={checkOut} onChangeText={setCheckOut} style={{ flex:1 }} dense />
              </View>
              <TextInput label="Note (optional)" mode="outlined" value={note} onChangeText={setNote} dense style={{ marginBottom:12 }} />
              <Button mode="contained" loading={markMutation.isPending}
                onPress={() => markMutation.mutate({ date:today, status, checkInTime: checkIn||undefined, checkOutTime: checkOut||undefined, note: note||undefined })}>
                Mark Attendance
              </Button>
            </Surface>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Form Modal ────────────────────────────────────────────────────────────────
function HelpFormModal({ visible, help, onClose, onSave, loading, colors }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, workingDays:[...EMPTY_FORM.workingDays], workTimings:{...EMPTY_FORM.workTimings} });
  React.useEffect(() => {
    if (visible) setForm(help ? { name:help.name, helpType:help.helpType, phone:help.phone||'', aadhaar:help.aadhaar||'', photoUrl:help.photoUrl||'', workingDays:help.workingDays||[...EMPTY_FORM.workingDays], workTimings:help.workTimings||{...EMPTY_FORM.workTimings} } : { ...EMPTY_FORM, workingDays:[...EMPTY_FORM.workingDays], workTimings:{...EMPTY_FORM.workTimings} });
  }, [visible, help]);
  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));
  const toggleDay = (d) => setForm(f => ({ ...f, workingDays: f.workingDays.includes(d) ? f.workingDays.filter(x=>x!==d) : [...f.workingDays, d] }));
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.sheet, { backgroundColor: colors.surface }]}>
          <View style={modalStyles.header}>
            <Text variant="titleMedium" style={{ fontWeight:'700', color: colors.onSurface }}>{help ? 'Edit Helper' : 'Add Daily Help'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.onSurfaceVariant} /></TouchableOpacity>
          </View>
          <Divider />
          <ScrollView contentContainerStyle={{ padding:16, gap:12 }} showsVerticalScrollIndicator={false}>
            <TextInput label="Full Name *" mode="outlined" value={form.name} onChangeText={v => set('name', v)} />
            <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>Type *</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
              {HELP_TYPES.map(t => <Chip key={t} selected={form.helpType===t} onPress={() => set('helpType', t)} compact>{t.charAt(0).toUpperCase()+t.slice(1)}</Chip>)}
            </View>
            <TextInput label="Phone" mode="outlined" value={form.phone} keyboardType="phone-pad" onChangeText={v => set('phone', v)} />
            <TextInput label="Aadhaar (12 digits)" mode="outlined" value={form.aadhaar} keyboardType="numeric" maxLength={12} onChangeText={v => set('aadhaar', v)} />
            <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>Working Days</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
              {DAYS.map(d => <Chip key={d} selected={form.workingDays.includes(d)} onPress={() => toggleDay(d)} compact>{DAY_SHORT[d]}</Chip>)}
            </View>
            <View style={{ flexDirection:'row', gap:10 }}>
              <TextInput label="Start Time" mode="outlined" placeholder="08:00" value={form.workTimings.startTime} onChangeText={v => set('workTimings', { ...form.workTimings, startTime:v })} style={{ flex:1 }} />
              <TextInput label="End Time" mode="outlined" placeholder="10:00" value={form.workTimings.endTime} onChangeText={v => set('workTimings', { ...form.workTimings, endTime:v })} style={{ flex:1 }} />
            </View>
          </ScrollView>
          <View style={{ padding:16, gap:8 }}>
            <Button mode="contained" onPress={() => onSave(form)} loading={loading} disabled={!form.name}>{help ? 'Update Helper' : 'Add Helper'}</Button>
            <Button mode="outlined" onPress={onClose}>Cancel</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Helper Card ───────────────────────────────────────────────────────────────
function HelpCard({ help, colors, onEdit, onDelete, onAttendance }) {
  const cfg = TYPE_CONFIG[help.helpType] || TYPE_CONFIG.other;
  const initials = help.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const todayDay = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
  const isToday  = help.workingDays?.includes(todayDay);
  return (
    <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={2}>
      <View style={styles.cardRow}>
        <Avatar.Text size={50} label={initials} style={{ backgroundColor: cfg.color }} labelStyle={{ color:'#fff', fontWeight:'700', fontSize:16 }} />
        <View style={styles.cardInfo}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
            <Text variant="titleSmall" style={{ fontWeight:'700', color: colors.onSurface }}>{help.name}</Text>
            {isToday && <View style={{ paddingHorizontal:6, paddingVertical:2, borderRadius:6, backgroundColor:'#2E7D32'+'20' }}><Text style={{ color:'#2E7D32', fontSize:10, fontWeight:'700' }}>TODAY</Text></View>}
          </View>
          <View style={[styles.typeBadge, { backgroundColor: cfg.color+'18' }]}>
            <Ionicons name={cfg.icon} size={12} color={cfg.color} />
            <Text style={{ color: cfg.color, fontSize:12, fontWeight:'600', marginLeft:4, textTransform:'capitalize' }}>{help.helpType}</Text>
          </View>
          {help.phone && <View style={styles.metaRow}><Ionicons name="call-outline" size={12} color={colors.onSurfaceVariant} /><Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft:4 }}>{help.phone}</Text></View>}
          <View style={styles.metaRow}><Ionicons name="time-outline" size={12} color={colors.onSurfaceVariant} /><Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft:4 }}>{help.workTimings?.startTime} – {help.workTimings?.endTime}</Text></View>
          <View style={{ flexDirection:'row', gap:4, marginTop:4 }}>
            {DAYS.map(d => (
              <View key={d} style={{ width:20, height:20, borderRadius:10, alignItems:'center', justifyContent:'center', backgroundColor: help.workingDays?.includes(d) ? cfg.color : colors.surfaceVariant }}>
                <Text style={{ color: help.workingDays?.includes(d) ? '#fff' : colors.onSurfaceVariant, fontSize:9, fontWeight:'700' }}>{DAY_SHORT[d][0]}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <Divider style={{ marginVertical:10 }} />
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor:'#2E7D32'+'18' }]} onPress={() => onAttendance(help)}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#2E7D32" /><Text style={{ color:'#2E7D32', fontSize:12, fontWeight:'600', marginLeft:6 }}>Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primaryContainer }]} onPress={() => onEdit(help)}>
          <Ionicons name="pencil-outline" size={16} color={colors.primary} /><Text style={{ color: colors.primary, fontSize:12, fontWeight:'600', marginLeft:6 }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor:'#FDECEA' }]} onPress={() => onDelete(help)}>
          <Ionicons name="trash-outline" size={16} color="#C62828" /><Text style={{ color:'#C62828', fontSize:12, fontWeight:'600', marginLeft:6 }}>Remove</Text>
        </TouchableOpacity>
      </View>
    </Surface>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DailyHelpScreen({ navigation }) {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [formVisible, setFormVisible] = useState(false);
  const [attVisible,  setAttVisible]  = useState(false);
  const [editing,      setEditing]    = useState(null);
  const [selectedHelp, setSelectedHelp] = useState(null);
  const [activeType,   setActiveType] = useState('all');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.DAILY_HELPS,
    queryFn: () => dailyHelpService.getAll().then(r => r.data.data),
  });

  const addMutation    = useMutation({ mutationFn: dailyHelpService.add,                             onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.DAILY_HELPS }); setFormVisible(false); }, onError: (e) => Alert.alert('Error', e.response?.data?.message||'Failed') });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => dailyHelpService.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.DAILY_HELPS }); setFormVisible(false); setEditing(null); }, onError: (e) => Alert.alert('Error', e.response?.data?.message||'Failed') });
  const deleteMutation = useMutation({ mutationFn: dailyHelpService.remove,                          onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.DAILY_HELPS }), onError: (e) => Alert.alert('Error', e.response?.data?.message||'Failed') });

  const handleSave = (form) => {
    const p = { ...form };
    if (!p.phone) delete p.phone; if (!p.aadhaar) delete p.aadhaar; if (!p.photoUrl) delete p.photoUrl;
    editing ? updateMutation.mutate({ id: editing._id, data:p }) : addMutation.mutate(p);
  };
  const handleDelete = (h) => Alert.alert('Remove', `Remove ${h.name}?`, [{ text:'Cancel', style:'cancel' }, { text:'Remove', style:'destructive', onPress: () => deleteMutation.mutate(h._id) }]);

  if (isLoading) return <LoadingScreen />;
  const all      = data || [];
  const types    = ['all', ...new Set(all.map(h => h.helpType))];
  const filtered = activeType === 'all' ? all : all.filter(h => h.helpType === activeType);

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Daily Help" titleStyle={{ fontWeight:'700' }} />
        <Appbar.Action icon="plus" onPress={() => { setEditing(null); setFormVisible(true); }} />
      </Appbar.Header>

      {all.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight:56 }} contentContainerStyle={{ paddingHorizontal:16, paddingVertical:10, gap:8 }}>
          {types.map(t => <Chip key={t} selected={activeType===t} onPress={() => setActiveType(t)} compact>{t==='all'?'All':t.charAt(0).toUpperCase()+t.slice(1)}</Chip>)}
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={[styles.scroll, filtered.length===0 && { flex:1 }]} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <EmptyState icon="person-add-outline" title="No Daily Help Added" message="Register your maids, cooks, drivers and helpers here." />
        ) : filtered.map(h => (
          <HelpCard key={h._id} help={h} colors={colors}
            onEdit={(h) => { setEditing(h); setFormVisible(true); }}
            onDelete={handleDelete}
            onAttendance={(h) => { setSelectedHelp(h); setAttVisible(true); }}
          />
        ))}
      </ScrollView>

      <FAB icon="plus" style={[styles.fab, { backgroundColor: colors.primary }]} color={colors.onPrimary} onPress={() => { setEditing(null); setFormVisible(true); }} />
      <HelpFormModal visible={formVisible} help={editing} onClose={() => { setFormVisible(false); setEditing(null); }} onSave={handleSave} loading={addMutation.isPending || updateMutation.isPending} colors={colors} />
      <AttendanceModal visible={attVisible} help={selectedHelp} onClose={() => { setAttVisible(false); setSelectedHelp(null); }} colors={colors} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex:1 }, scroll: { padding:16, paddingBottom:100, gap:12 },
  card: { borderRadius:16, padding:14 }, cardRow: { flexDirection:'row', gap:12, alignItems:'flex-start' },
  cardInfo: { flex:1, gap:4 },
  typeBadge: { flexDirection:'row', alignItems:'center', alignSelf:'flex-start', paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  metaRow: { flexDirection:'row', alignItems:'center', marginTop:1 },
  actionRow: { flexDirection:'row', gap:8 },
  actionBtn: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical:8, borderRadius:10 },
  fab: { position:'absolute', right:20, bottom:24 },
});
const modalStyles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  sheet: { borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'90%' },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:18, paddingBottom:12 },
});