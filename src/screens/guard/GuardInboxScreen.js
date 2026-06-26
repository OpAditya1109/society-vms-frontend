// src/screens/guard/GuardInboxScreen.js
import React, { useState, useCallback, useRef } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, TextInput, Modal, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { Text, useTheme, Appbar, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  useGuardMessages,
  useMarkMessageRead,
  useReplyToMessage,
} from '../../hooks/useGuards';
import { EmptyState } from '../../components/common';

const GUARD_ACCENT = '#E65100';

// ── Reply Modal ───────────────────────────────────────────────────────────────
function ReplyModal({ visible, msg, onClose, onSend, isSending }) {
  const [text, setText] = useState('');
  const { colors } = useTheme();

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  const handleClose = () => {
    setText('');
    onClose();
  };

  if (!msg) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Reply to Resident</Text>
              <Text style={styles.modalSub} numberOfLines={1}>
                {msg.fromResident?.firstName} {msg.fromResident?.lastName}
                {msg.fromResident?.flatNumber ? ` · Flat ${msg.fromResident.flatNumber}` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Original message */}
          <View style={[styles.originalMsg, { backgroundColor: colors.background }]}>
            <Text style={[styles.originalLabel, { color: colors.onSurfaceVariant }]}>Original message</Text>
            <Text style={[styles.originalText, { color: colors.onSurface }]}>{msg.message}</Text>
          </View>

          {/* Previous reply if exists */}
          {msg.guardReply && (
            <View style={[styles.prevReply, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.originalLabel, { color: '#E65100' }]}>Your previous reply</Text>
              <Text style={[styles.originalText, { color: '#BF360C' }]}>{msg.guardReply}</Text>
            </View>
          )}

          {/* Reply input */}
          <TextInput
            style={[
              styles.replyInput,
              {
                borderColor: colors.outlineVariant,
                color: colors.onSurface,
                backgroundColor: colors.background,
              },
            ]}
            placeholder="Type your reply…"
            placeholderTextColor={colors.onSurfaceVariant}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            numberOfLines={3}
            autoFocus
          />
          <Text style={[styles.charCount, { color: colors.onSurfaceVariant }]}>{text.length}/500</Text>

          {/* Send button */}
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: text.trim() ? GUARD_ACCENT : colors.surfaceVariant },
            ]}
            onPress={handleSend}
            disabled={!text.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={16} color={text.trim() ? '#fff' : colors.onSurfaceVariant} />
                <Text style={[styles.sendBtnText, { color: text.trim() ? '#fff' : colors.onSurfaceVariant }]}>
                  Send Reply
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Filter Chips ──────────────────────────────────────────────────────────────
function FilterChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Message Card ──────────────────────────────────────────────────────────────
function MessageCard({ msg, onMarkRead, onReply }) {
  const { colors } = useTheme();
  const isUnread = !msg.isRead;

  return (
    <Surface
      style={[
        styles.msgCard,
        { backgroundColor: colors.surface },
        isUnread && styles.msgCardUnread,
      ]}
      elevation={isUnread ? 3 : 1}
    >
      {/* Sender + time */}
      <View style={styles.msgHeader}>
        <View style={[styles.avatar, { backgroundColor: GUARD_ACCENT + '1A' }]}>
          <Ionicons name="account-outline" size={18} color={GUARD_ACCENT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.msgFrom, { color: colors.onSurface }]}>
            {msg.fromResident?.firstName} {msg.fromResident?.lastName}
            {msg.fromResident?.flatNumber
              ? <Text style={{ color: colors.onSurfaceVariant, fontWeight: '400' }}> · Flat {msg.fromResident.flatNumber}</Text>
              : null}
          </Text>
          <Text style={[styles.msgTime, { color: colors.onSurfaceVariant }]}>
            {new Date(msg.createdAt).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </View>
        {isUnread && (
          <View style={styles.unreadDot} />
        )}
      </View>

      {/* Message body */}
      <Text style={[styles.msgBody, { color: colors.onSurface }]}>{msg.message}</Text>

      {/* Guard reply bubble */}
      {msg.guardReply && (
        <View style={[styles.replyBubble, { backgroundColor: '#FFF3E0' }]}>
          <View style={styles.replyBubbleHeader}>
            <Ionicons name="return-down-forward-outline" size={13} color={GUARD_ACCENT} />
            <Text style={[styles.replyBubbleLabel, { color: GUARD_ACCENT }]}>Your reply</Text>
            {msg.repliedAt && (
              <Text style={[styles.msgTime, { color: '#BF360C', marginLeft: 'auto' }]}>
                {new Date(msg.repliedAt).toLocaleString('en-IN', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 13, color: '#BF360C', lineHeight: 19 }}>{msg.guardReply}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.msgActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: GUARD_ACCENT + '12', borderColor: GUARD_ACCENT + '30' }]}
          onPress={() => onReply(msg)}
          activeOpacity={0.75}
        >
          <Ionicons name="return-down-forward-outline" size={15} color={GUARD_ACCENT} />
          <Text style={[styles.actionBtnText, { color: GUARD_ACCENT }]}>
            {msg.guardReply ? 'Edit Reply' : 'Reply'}
          </Text>
        </TouchableOpacity>

        {isUnread && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' }]}
            onPress={() => onMarkRead(msg._id)}
            activeOpacity={0.75}
          >
            <Ionicons name="checkmark-done" size={15} color="#2E7D32" />
            <Text style={[styles.actionBtnText, { color: '#2E7D32' }]}>Mark Read</Text>
          </TouchableOpacity>
        )}
      </View>
    </Surface>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function GuardInboxScreen() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState('all');   // 'all' | 'unread' | 'replied'
  const [replyModal, setReplyModal] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);

  const { data, isLoading, refetch, isRefetching } = useGuardMessages();
  const markReadMutation = useMarkMessageRead();
  const replyMutation = useReplyToMessage();

  const messages = data?.data?.messages ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  const filtered = messages.filter((m) => {
    if (filter === 'unread') return !m.isRead;
    if (filter === 'replied') return !!m.guardReply;
    return true;
  });

  const handleMarkRead = useCallback((id) => {
    markReadMutation.mutate(id);
  }, [markReadMutation]);

  const handleOpenReply = useCallback((msg) => {
    setSelectedMsg(msg);
    setReplyModal(true);
  }, []);

  const handleSendReply = useCallback((replyText) => {
    if (!selectedMsg) return;
    replyMutation.mutate(
      { messageId: selectedMsg._id, reply: replyText },
      { onSuccess: () => setReplyModal(false) }
    );
  }, [selectedMsg, replyMutation]);

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.Content
          title="Inbox"
          titleStyle={{ fontWeight: '700' }}
        />
        {unreadCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </Appbar.Header>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        <FilterChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterChip
          label={`Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
          active={filter === 'unread'}
          onPress={() => setFilter('unread')}
        />
        <FilterChip label="Replied" active={filter === 'replied'} onPress={() => setFilter('replied')} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={GUARD_ACCENT} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <MessageCard
              msg={item}
              onMarkRead={handleMarkRead}
              onReply={handleOpenReply}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[GUARD_ACCENT]}
              tintColor={GUARD_ACCENT}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title={filter === 'unread' ? 'No unread messages' : filter === 'replied' ? 'No replied messages' : 'No messages yet'}
              subtitle="Messages from residents will appear here."
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <ReplyModal
        visible={replyModal}
        msg={selectedMsg}
        onClose={() => setReplyModal(false)}
        onSend={handleSendReply}
        isSending={replyMutation.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  chipActive: { backgroundColor: GUARD_ACCENT },
  chipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  chipTextActive: { color: '#fff' },

  headerBadge: {
    backgroundColor: GUARD_ACCENT,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  msgCard: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  msgCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: GUARD_ACCENT,
  },
  msgHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgFrom: { fontSize: 14, fontWeight: '700' },
  msgTime: { fontSize: 11, marginTop: 2 },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: GUARD_ACCENT,
    marginLeft: 4,
  },
  msgBody: { fontSize: 14, lineHeight: 21 },

  replyBubble: {
    borderRadius: 10,
    padding: 10,
    gap: 5,
  },
  replyBubbleHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  replyBubbleLabel: { fontSize: 11, fontWeight: '700' },

  msgActions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  modalSub: { fontSize: 13, color: '#757575', marginTop: 2 },
  originalMsg: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  prevReply: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  originalLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  originalText: { fontSize: 14, lineHeight: 20 },
  replyInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: -6 },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  sendBtnText: { fontSize: 15, fontWeight: '700' },
});