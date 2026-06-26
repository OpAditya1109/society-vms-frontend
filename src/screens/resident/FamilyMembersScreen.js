// src/screens/resident/FamilyMembersScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal } from 'react-native';
import { Text, useTheme, Appbar, Surface, Avatar, Divider, TextInput, Button, FAB, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { familyMemberService } from '../../api/services';
import { QUERY_KEYS } from '../../constants';
import { EmptyState, LoadingScreen } from '../../components/common';

const RELATIONS = ['spouse','child','parent','sibling','grandparent','grandchild','in-law','cousin','other'];
const RELATION_COLORS = { spouse:'#E91E63', child:'#FF9800', parent:'#3F51B5', sibling:'#009688', grandparent:'#607D8B', grandchild:'#FF5722', 'in-law':'#795548', cousin:'#9C27B0', other:'#757575' };
const RELATION_ICONS  = { spouse:'heart-outline', child:'happy-outline', parent:'account-outline', sibling:'people-outline', grandparent:'account-outline', grandchild:'happy-outline', 'in-law':'people-outline', cousin:'people-outline', other:'account-outline' };

const EMPTY_FORM = { name:'', relation:'spouse', phone:'', email:'', dob:'', photoUrl:'' };

function MemberCard({ member, colors, onEdit, onDelete }) {
  const color = RELATION_COLORS[member.relation] || '#757575';
  const icon  = RELATION_ICONS[member.relation]  || 'account-outline';
  const initials = member.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  return (
    <Surface style={[styles.card, { backgroundColor: colors.surface }]} elevation={2}>
      <View style={styles.cardRow}>
        <Avatar.Text size={46} label={initials} style={{ backgroundColor: color }} labelStyle={{ color:'#fff', fontWeight:'700', fontSize:16 }} />
        <View style={styles.cardInfo}>
          <Text variant="titleSmall" style={{ fontWeight:'700', color: colors.onSurface }}>{member.name}</Text>
          <View style={[styles.badge, { backgroundColor: color + '18' }]}>
            <Ionicons name={icon} size={12} color={color} />
            <Text style={{ color, fontSize:12, fontWeight:'600', marginLeft:4, textTransform:'capitalize' }}>{member.relation}</Text>
          </View>
          {member.phone && <View style={styles.metaRow}><Ionicons name="phone-outline" size={12} color={colors.onSurfaceVariant} /><Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft:4 }}>{member.phone}</Text></View>}
          {member.dob   && <View style={styles.metaRow}><Ionicons name="calendar-outline" size={12} color={colors.onSurfaceVariant} /><Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft:4 }}>{new Date(member.dob).toLocaleDateString('en-IN')}</Text></View>}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.primaryContainer }]} onPress={() => onEdit(member)}><Ionicons name="pencil-outline" size={16} color={colors.primary} /></TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor:'#FDECEA' }]} onPress={() => onDelete(member)}><Ionicons name="trash-outline" size={16} color="#C62828" /></TouchableOpacity>
        </View>
      </View>
    </Surface>
  );
}

function MemberFormModal({ visible, member, onClose, onSave, loading, colors }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  React.useEffect(() => {
    if (visible) setForm(member ? { name: member.name, relation: member.relation, phone: member.phone||'', email: member.email||'', dob: member.dob ? member.dob.split('T')[0] : '', photoUrl: member.photoUrl||'' } : { ...EMPTY_FORM });
  }, [visible, member]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.sheet, { backgroundColor: colors.surface }]}>
          <View style={modalStyles.header}>
            <Text variant="titleMedium" style={{ fontWeight:'700', color: colors.onSurface }}>{member ? 'Edit Family Member' : 'Add Family Member'}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={colors.onSurfaceVariant} /></TouchableOpacity>
          </View>
          <Divider />
          <ScrollView contentContainerStyle={{ padding:16, gap:12 }} showsVerticalScrollIndicator={false}>
            <TextInput label="Full Name *" mode="outlined" value={form.name} onChangeText={v => set('name', v)} />
            <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>Relation *</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
              {RELATIONS.map(r => <Chip key={r} selected={form.relation===r} onPress={() => set('relation', r)} compact style={{ marginBottom:4 }}>{r.charAt(0).toUpperCase()+r.slice(1)}</Chip>)}
            </View>
            <TextInput label="Phone" mode="outlined" value={form.phone} keyboardType="phone-pad" onChangeText={v => set('phone', v)} />
            <TextInput label="Email" mode="outlined" value={form.email} keyboardType="email-address" autoCapitalize="none" onChangeText={v => set('email', v)} />
            <TextInput label="Date of Birth (YYYY-MM-DD)" mode="outlined" value={form.dob} placeholder="1990-05-15" onChangeText={v => set('dob', v)} />
          </ScrollView>
          <View style={{ padding:16, gap:8 }}>
            <Button mode="contained" onPress={() => onSave(form)} loading={loading} disabled={!form.name || !form.relation}>{member ? 'Update Member' : 'Add Member'}</Button>
            <Button mode="outlined" onPress={onClose}>Cancel</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function FamilyMembersScreen({ navigation }) {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.FAMILY_MEMBERS,
    queryFn: () => familyMemberService.getAll().then(r => r.data.data),
  });

  const addMutation    = useMutation({ mutationFn: familyMemberService.add,                              onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.FAMILY_MEMBERS }); setModalVisible(false); }, onError: (e) => Alert.alert('Error', e.response?.data?.message || 'Failed') });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => familyMemberService.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.FAMILY_MEMBERS }); setModalVisible(false); setEditing(null); }, onError: (e) => Alert.alert('Error', e.response?.data?.message || 'Failed') });
  const deleteMutation = useMutation({ mutationFn: familyMemberService.remove,                           onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.FAMILY_MEMBERS }), onError: (e) => Alert.alert('Error', e.response?.data?.message || 'Failed') });

  const handleSave = (form) => {
    const p = { ...form };
    if (!p.phone) delete p.phone; if (!p.email) delete p.email; if (!p.dob) delete p.dob; if (!p.photoUrl) delete p.photoUrl;
    editing ? updateMutation.mutate({ id: editing._id, data: p }) : addMutation.mutate(p);
  };

  const handleDelete = (m) => Alert.alert('Remove', `Remove ${m.name}?`, [{ text:'Cancel', style:'cancel' }, { text:'Remove', style:'destructive', onPress: () => deleteMutation.mutate(m._id) }]);

  if (isLoading) return <LoadingScreen />;
  const members = data || [];

  return (
    <SafeAreaView  edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Family Members" titleStyle={{ fontWeight:'700' }} />
        <Appbar.Action icon="plus" onPress={() => { setEditing(null); setModalVisible(true); }} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={[styles.scroll, members.length===0 && { flex:1 }]} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />} showsVerticalScrollIndicator={false}>
        {members.length === 0 ? (
          <EmptyState icon="people-outline" title="No Family Members" message="Add your family members to keep them registered with the society." />
        ) : (
          <>
            <View style={[styles.statsBar, { backgroundColor: colors.primaryContainer + '60' }]}>
              <Ionicons name="people" size={16} color={colors.primary} />
              <Text variant="labelMedium" style={{ color: colors.primary, marginLeft:6, fontWeight:'600' }}>{members.length} member{members.length!==1?'s':''} registered</Text>
            </View>
            {members.map(m => <MemberCard key={m._id} member={m} colors={colors} onEdit={(m) => { setEditing(m); setModalVisible(true); }} onDelete={handleDelete} />)}
          </>
        )}
      </ScrollView>
      <FAB icon="plus" style={[styles.fab, { backgroundColor: colors.primary }]} color={colors.onPrimary} onPress={() => { setEditing(null); setModalVisible(true); }} />
      <MemberFormModal visible={modalVisible} member={editing} onClose={() => { setModalVisible(false); setEditing(null); }} onSave={handleSave} loading={addMutation.isPending || updateMutation.isPending} colors={colors} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex:1 }, scroll: { padding:16, paddingBottom:100, gap:12 },
  statsBar: { flexDirection:'row', alignItems:'center', padding:10, borderRadius:10, marginBottom:4 },
  card: { borderRadius:16, padding:14 }, cardRow: { flexDirection:'row', alignItems:'center', gap:12 },
  cardInfo: { flex:1, gap:3 }, cardActions: { gap:8 },
  badge: { flexDirection:'row', alignItems:'center', alignSelf:'flex-start', paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  metaRow: { flexDirection:'row', alignItems:'center', marginTop:2 },
  iconBtn: { width:32, height:32, borderRadius:10, alignItems:'center', justifyContent:'center' },
  fab: { position:'absolute', right:20, bottom:24 },
});
const modalStyles = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
  sheet: { borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'90%' },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:18, paddingBottom:12 },
});