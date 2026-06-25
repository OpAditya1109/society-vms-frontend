// src/screens/resident/CommunityScreen.js
import React, { useState, useCallback, useRef } from 'react';
import {
  View, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  Text, useTheme, Appbar, Modal, Portal, Divider,
  IconButton, Menu, Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import Toast from 'react-native-toast-message';

import {
  useCommunityPosts, useMyPosts, useCreatePost,
  useDeletePost, useToggleLike, useAddComment, useDeleteComment,
} from '../../hooks/useCommunity';
import { AppButton, AppInput, EmptyState, ErrorState } from '../../components/common';
import { useSelector } from 'react-redux';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'general',      label: 'General',       icon: 'chatbubble-ellipses-outline', color: '#607D8B' },
  { value: 'event',        label: 'Event',          icon: 'calendar-outline',            color: '#7B1FA2' },
  { value: 'business',     label: 'Business',       icon: 'briefcase-outline',           color: '#1565C0' },
  { value: 'announcement', label: 'Announcement',   icon: 'megaphone-outline',           color: '#E65100' },
  { value: 'lostfound',    label: 'Lost & Found',   icon: 'search-outline',              color: '#00897B' },
  { value: 'helpneeded',   label: 'Help Needed',    icon: 'hand-left-outline',           color: '#C62828' },
];

const CAT_FILTERS = [{ value: '', label: 'All', icon: 'apps-outline', color: '#333' }, ...CATEGORIES];

const schema = z.object({
  title:       z.string().trim().min(5, 'At least 5 chars').max(150),
  body:        z.string().trim().min(10, 'At least 10 chars').max(2000),
  category:    z.string().min(1, 'Pick a category'),
  contactInfo: z.string().trim().max(100).optional(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCatMeta(value) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[0];
}

function timeAgo(dateStr) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return '';
  }
}

// ── PostCard ──────────────────────────────────────────────────────────────────
function PostCard({ post, onLike, onDelete, onOpenDetail, currentUserId, colors }) {
  const cat    = getCatMeta(post.category);
  const isOwn  = post.postedBy?._id === currentUserId || post.postedBy?.toString?.() === currentUserId;
  const liked  = (post.likes ?? []).some?.((l) =>
    (typeof l === 'string' ? l : l?._id?.toString?.()) === currentUserId
  ) ?? false;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onOpenDetail}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
    >
      {/* Pin badge */}
      {post.isPinned && (
        <View style={[styles.pinBadge, { backgroundColor: colors.primaryContainer }]}>
          <Ionicons name="pin" size={11} color={colors.primary} />
          <Text variant="labelSmall" style={{ color: colors.primary, marginLeft: 3 }}>Pinned</Text>
        </View>
      )}

      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={[styles.avatarCircle, { backgroundColor: cat.color + '20' }]}>
          <Ionicons name={cat.icon} size={18} color={cat.color} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text variant="titleSmall" numberOfLines={1} style={{ fontWeight: '700' }}>
            {post.title}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
            {post.postedBy?.firstName} {post.postedBy?.lastName}
            {post.flatNumber ? ` · Flat ${post.flatNumber}` : ''}
            {'  ·  '}{timeAgo(post.createdAt)}
          </Text>
        </View>
        <View style={[styles.catChip, { backgroundColor: cat.color + '15', borderColor: cat.color + '40' }]}>
          <Text style={{ fontSize: 10, color: cat.color, fontWeight: '700' }}>{cat.label}</Text>
        </View>
      </View>

      {/* Body */}
      <Text variant="bodyMedium" numberOfLines={3} style={[styles.cardBody, { color: colors.onSurface }]}>
        {post.body}
      </Text>

      {/* Contact info (for event/business) */}
      {!!post.contactInfo && (
        <View style={[styles.contactRow, { backgroundColor: colors.surfaceVariant }]}>
          <Ionicons name="phone-outline" size={13} color={colors.onSurfaceVariant} />
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft: 4 }}>
            {post.contactInfo}
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={[styles.cardFooter, { borderTopColor: colors.outlineVariant }]}>
        <TouchableOpacity style={styles.footerAction} onPress={onLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? '#E53935' : colors.onSurfaceVariant}
          />
          <Text variant="bodySmall" style={{ marginLeft: 4, color: liked ? '#E53935' : colors.onSurfaceVariant }}>
            {post.likeCount ?? (post.likes?.length ?? 0)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerAction} onPress={onOpenDetail}>
          <Ionicons name="chatbubble-outline" size={17} color={colors.onSurfaceVariant} />
          <Text variant="bodySmall" style={{ marginLeft: 4, color: colors.onSurfaceVariant }}>
            {post.commentCount ?? (post.comments?.length ?? 0)}
          </Text>
        </TouchableOpacity>

        {isOwn && (
          <TouchableOpacity style={styles.footerAction} onPress={() => onDelete(post._id)}>
            <Ionicons name="trash-outline" size={17} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── PostDetailModal (comments) ────────────────────────────────────────────────
function PostDetailModal({ visible, post, onDismiss, currentUserId, colors }) {
  const [commentText, setCommentText] = useState('');
  const addComment    = useAddComment(post?._id);
  const deleteComment = useDeleteComment(post?._id);
  const cat = getCatMeta(post?.category);

  const handleAddComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    addComment.mutate(trimmed, { onSuccess: () => setCommentText('') });
  };

  if (!post) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.detailModal, { backgroundColor: colors.surface }]}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <View style={[styles.avatarCircle, { backgroundColor: cat.color + '20' }]}>
              <Ionicons name={cat.icon} size={18} color={cat.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text variant="titleMedium" style={{ fontWeight: '700' }}>{post.title}</Text>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                {post.postedBy?.firstName} {post.postedBy?.lastName}
                {post.flatNumber ? ` · Flat ${post.flatNumber}` : ''}
              </Text>
            </View>
            <IconButton icon="close" size={22} onPress={onDismiss} />
          </View>

          <Divider />

          {/* Body */}
          <Text variant="bodyMedium" style={[styles.detailBody, { color: colors.onSurface }]}>
            {post.body}
          </Text>
          {!!post.contactInfo && (
            <View style={[styles.contactRow, { backgroundColor: colors.surfaceVariant, marginHorizontal: 16, marginBottom: 8 }]}>
              <Ionicons name="phone-outline" size={13} color={colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft: 4 }}>{post.contactInfo}</Text>
            </View>
          )}

          <Divider />
          <Text variant="labelMedium" style={{ marginHorizontal: 16, marginTop: 10, color: colors.onSurfaceVariant }}>
            Comments ({post.comments?.length ?? 0})
          </Text>

          {/* Comments list */}
          <FlatList
            data={post.comments ?? []}
            keyExtractor={(c) => c._id}
            style={{ maxHeight: 220, marginTop: 6 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 6 }}
            ListEmptyComponent={
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 12 }}>
                No comments yet. Be the first!
              </Text>
            }
            renderItem={({ item }) => {
              const isOwn = item.postedBy?._id === currentUserId ||
                            item.postedBy?.toString?.() === currentUserId;
              return (
                <View style={[styles.commentRow, { borderBottomColor: colors.outlineVariant }]}>
                  <View style={{ flex: 1 }}>
                    <Text variant="labelSmall" style={{ color: colors.primary, fontWeight: '700' }}>
                      {item.postedBy?.firstName} {item.postedBy?.lastName}
                      {item.postedBy?.flatNumber ? ` · Flat ${item.postedBy.flatNumber}` : ''}
                    </Text>
                    <Text variant="bodySmall" style={{ color: colors.onSurface, marginTop: 2 }}>
                      {item.text}
                    </Text>
                    <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: 2 }}>
                      {timeAgo(item.createdAt)}
                    </Text>
                  </View>
                  {isOwn && (
                    <IconButton
                      icon="delete-outline"
                      size={16}
                      iconColor={colors.error}
                      onPress={() => deleteComment.mutate(item._id)}
                      disabled={deleteComment.isPending}
                      style={{ margin: 0 }}
                    />
                  )}
                </View>
              );
            }}
          />

          {/* Add comment */}
          <View style={[styles.commentInput, { borderTopColor: colors.outlineVariant, backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.commentTextInput, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
              placeholder="Write a comment…"
              placeholderTextColor={colors.onSurfaceVariant}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: commentText.trim() ? colors.primary : colors.outlineVariant }]}
              onPress={handleAddComment}
              disabled={!commentText.trim() || addComment.isPending}
            >
              <Ionicons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CommunityScreen() {
  const { colors } = useTheme();
  const user = useSelector((s) => s.auth?.user);
  const currentUserId = user?._id ?? user?.id;

  const [tab,          setTab]          = useState('feed');
  const [catFilter,    setCatFilter]    = useState('');
  const [showForm,     setShowForm]     = useState(false);
  const [filterMenu,   setFilterMenu]   = useState(false);
  const [detailPost,   setDetailPost]   = useState(null);
  const [refreshing,   setRefreshing]   = useState(false);

  const {
    data: feedData, isLoading: feedLoading, isError: feedError,
    error: feedErr, refetch: refetchFeed,
  } = useCommunityPosts({ category: catFilter || undefined, limit: 50 });

  const {
    data: myData, isLoading: myLoading, isError: myError,
    error: myErr, refetch: refetchMy,
  } = useMyPosts();

  const createMutation = useCreatePost();
  const deleteMutation = useDeletePost();

  const posts   = feedData?.data   ?? [];
  const myPosts = myData?.data     ?? [];

  const {
    control, handleSubmit, reset, watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', body: '', category: '', contactInfo: '' },
  });

  const watchCategory = watch('category');
  const showContact   = watchCategory === 'event' || watchCategory === 'business';

  const onSubmit = (values) => {
    // ✅ Validate category is truly selected
    if (!values.category || values.category.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a category before posting',
      });
      return;
    }

    // ✅ Validate title
    if (!values.title || values.title.trim().length < 5) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Title must be at least 5 characters',
      });
      return;
    }

    // ✅ Validate body
    if (!values.body || values.body.trim().length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Details must be at least 10 characters',
      });
      return;
    }

    // ✅ Build clean payload
    const payload = {
      title: values.title.trim(),
      body: values.body.trim(),
      category: values.category.trim(),
      ...(values.contactInfo?.trim() && { contactInfo: values.contactInfo.trim() }),
    };

    console.log('📤 Submitting community post:', payload); // For debugging

    createMutation.mutate(payload, {
      onSuccess: () => {
        reset();
        setShowForm(false);
        setTab('feed');
      },
      onError: (error) => {
        console.error('❌ Post creation error:', error);
        // Error handling is done in the hook
      },
    });
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFeed(), refetchMy()]);
    setRefreshing(false);
  }, [refetchFeed, refetchMy]);

  const handleLike = (postId) => {
    // inline toggle — using direct service call via mutation
    communityServiceToggleLike(postId);
  };

  // We need a quick like toggle per post without a hook per post —
  // we'll pass a callback down that the card uses
  const { mutate: likeMutate } = useToggleLike(null);

  const renderFeedItem = ({ item }) => (
    <PostCard
      post={item}
      colors={colors}
      currentUserId={currentUserId}
      onLike={() => {
        // Re-use communityService directly for simplicity since hook needs static id
        import('../../api/services/communityService').then(({ communityService }) => {
          communityService.toggleLike(item._id).then(() => refetchFeed());
        });
      }}
      onDelete={(id) => deleteMutation.mutate(id)}
      onOpenDetail={() => setDetailPost(item)}
    />
  );

  const renderMyItem = ({ item }) => (
    <PostCard
      post={item}
      colors={colors}
      currentUserId={currentUserId}
      onLike={() => {
        import('../../api/services/communityService').then(({ communityService }) => {
          communityService.toggleLike(item._id).then(() => refetchMy());
        });
      }}
      onDelete={(id) => deleteMutation.mutate(id)}
      onOpenDetail={() => setDetailPost(item)}
    />
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Appbar */}
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.Content title="Community" titleStyle={{ fontWeight: '700' }} />
        <Menu
          visible={filterMenu}
          onDismiss={() => setFilterMenu(false)}
          anchor={
            <Appbar.Action
              icon="filter-variant"
              color={catFilter ? colors.primary : colors.onSurface}
              onPress={() => setFilterMenu(true)}
            />
          }
        >
          {CAT_FILTERS.map((f) => (
            <Menu.Item
              key={f.value}
              title={f.label}
              leadingIcon={catFilter === f.value ? 'check' : undefined}
              onPress={() => { setCatFilter(f.value); setFilterMenu(false); }}
            />
          ))}
        </Menu>
        <Appbar.Action icon="plus-circle-outline" onPress={() => setShowForm(true)} />
      </Appbar.Header>

      {/* Tab selector */}
      <View style={styles.tabRow}>
        {[
          { value: 'feed', label: 'Community Feed', icon: 'newspaper-outline' },
          { value: 'mine', label: 'My Posts',       icon: 'account-outline'    },
        ].map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[
              styles.tabBtn,
              { borderBottomColor: tab === t.value ? colors.primary : 'transparent' },
            ]}
            onPress={() => setTab(t.value)}
          >
            <Ionicons
              name={t.icon}
              size={16}
              color={tab === t.value ? colors.primary : colors.onSurfaceVariant}
            />
            <Text
              variant="labelMedium"
              style={{
                marginLeft: 5,
                color: tab === t.value ? colors.primary : colors.onSurfaceVariant,
                fontWeight: tab === t.value ? '700' : '400',
              }}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active category filter banner */}
      {!!catFilter && (
        <View style={[styles.filterBanner, { backgroundColor: colors.primaryContainer }]}>
          <Text variant="bodySmall" style={{ color: colors.onPrimaryContainer }}>
            Showing: {CAT_FILTERS.find((c) => c.value === catFilter)?.label}
          </Text>
          <TouchableOpacity onPress={() => setCatFilter('')}>
            <Ionicons name="close-circle" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Feed tab */}
      {tab === 'feed' && (
        feedError ? (
          <ErrorState error={feedErr?.response?.data?.message ?? 'Failed to load posts'} onRetry={refetchFeed} />
        ) : feedLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>Loading posts…</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <EmptyState
                icon="newspaper-outline"
                title="No posts yet"
                subtitle="Be the first to post something to the community!"
              />
            }
            renderItem={renderFeedItem}
          />
        )
      )}

      {/* My posts tab */}
      {tab === 'mine' && (
        myError ? (
          <ErrorState error={myErr?.response?.data?.message ?? 'Failed to load your posts'} onRetry={refetchMy} />
        ) : myLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>Loading…</Text>
          </View>
        ) : (
          <FlatList
            data={myPosts}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <EmptyState
                icon="create-outline"
                title="No posts yet"
                subtitle="Share an event, business, or anything with your society!"
              />
            }
            renderItem={renderMyItem}
          />
        )
      )}

      {/* ── Create Post Modal ── */}
      <Portal>
        <Modal
          visible={showForm}
          onDismiss={() => { setShowForm(false); reset(); }}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>New Community Post</Text>

          {/* Category selector */}
          <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, marginBottom: 6 }}>Category *</Text>
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <View style={styles.catGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.catChipLarge,
                      {
                        backgroundColor: value === cat.value ? cat.color + '18' : colors.surfaceVariant,
                        borderColor:     value === cat.value ? cat.color        : colors.outlineVariant,
                      },
                    ]}
                    onPress={() => onChange(cat.value)}
                  >
                    <Ionicons name={cat.icon} size={14} color={value === cat.value ? cat.color : colors.onSurfaceVariant} />
                    <Text
                      variant="labelSmall"
                      style={{ marginLeft: 4, color: value === cat.value ? cat.color : colors.onSurfaceVariant }}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.category && (
            <Text variant="bodySmall" style={{ color: colors.error, marginBottom: 6 }}>
              {errors.category.message}
            </Text>
          )}

          {/* Title */}
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Title *"
                value={value}
                onChangeText={onChange}
                error={errors.title?.message}
                placeholder="Give your post a short title"
              />
            )}
          />

          {/* Body */}
          <Controller
            control={control}
            name="body"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Details *"
                value={value}
                onChangeText={onChange}
                multiline
                numberOfLines={4}
                error={errors.body?.message}
                placeholder="Share more details with your neighbours…"
              />
            )}
          />

          {/* Contact info — shown for event/business */}
          {showContact && (
            <Controller
              control={control}
              name="contactInfo"
              render={({ field: { onChange, value } }) => (
                <AppInput
                  label="Contact / Venue (optional)"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Phone number, WhatsApp, or location"
                />
              )}
            />
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <AppButton
              label="Cancel"
              mode="outlined"
              onPress={() => { setShowForm(false); reset(); }}
              style={{ flex: 1 }}
              disabled={createMutation.isPending}
            />
            <AppButton
              label="Post"
              onPress={handleSubmit(onSubmit)}
              loading={createMutation.isPending}
              style={{ flex: 2 }}
            />
          </View>
        </Modal>
      </Portal>

      {/* ── Post Detail / Comments Modal ── */}
      <PostDetailModal
        visible={!!detailPost}
        post={detailPost}
        onDismiss={() => setDetailPost(null)}
        currentUserId={currentUserId}
        colors={colors}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:        { flex: 1 },
  tabRow:        { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ddd' },
  tabBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderBottomWidth: 2 },
  list:          { padding: 14, paddingBottom: 32, flexGrow: 1 },
  filterBanner:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 7 },

  card:          { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12, overflow: 'hidden' },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', padding: 12 },
  cardBody:      { paddingHorizontal: 12, paddingBottom: 10, lineHeight: 20 },
  cardFooter:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, gap: 16 },
  footerAction:  { flexDirection: 'row', alignItems: 'center' },

  avatarCircle:  { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  catChip:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  pinBadge:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4 },
  contactRow:    { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 8, padding: 7, borderRadius: 8 },

  modal:         { margin: 16, borderRadius: 20, padding: 20, maxHeight: '92%' },
  modalTitle:    { fontWeight: '700', marginBottom: 12 },
  catGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  catChipLarge:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },

  detailModal:   { margin: 16, borderRadius: 20, maxHeight: '90%' },
  detailHeader:  { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12 },
  detailBody:    { padding: 16, paddingTop: 10, lineHeight: 22 },
  commentRow:    { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'flex-start' },
  commentInput:  { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  commentTextInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, maxHeight: 80 },
  sendBtn:       { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});