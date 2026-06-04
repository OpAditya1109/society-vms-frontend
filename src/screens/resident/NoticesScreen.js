// src/screens/resident/NoticesScreen.js
import React, { useState } from 'react';
import {
  View, FlatList, StyleSheet, ScrollView,
} from 'react-native';
import {
  Text, useTheme, Appbar, Modal, Portal, Chip, Divider, IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useNotices } from '../../hooks/useNotices';
import NoticeCard from '../../components/resident/NoticeCard';
import { SkeletonList } from '../../components/resident/SkeletonCard';
import { EmptyState, ErrorState } from '../../components/common';
import { NOTICE_TYPE } from '../../constants';

const TYPE_CONFIG = {
  [NOTICE_TYPE.GENERAL]:     { label: 'General',     color: '#1565C0', icon: 'information-circle-outline' },
  [NOTICE_TYPE.MAINTENANCE]: { label: 'Maintenance', color: '#E65100', icon: 'construct-outline' },
  [NOTICE_TYPE.EMERGENCY]:   { label: 'Emergency',   color: '#C62828', icon: 'warning-outline' },
  [NOTICE_TYPE.EVENT]:       { label: 'Event',       color: '#2E7D32', icon: 'calendar-outline' },
};

export default function NoticesScreen() {
  const { colors } = useTheme();
  const [selectedNotice, setSelectedNotice] = useState(null);

  const { data, isLoading, isError, error, refetch } = useNotices({ limit: 50 });

  const notices = data?.data ?? [];

  if (isError) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <Appbar.Header style={{ backgroundColor: colors.surface }}>
          <Appbar.Content title="Notices" titleStyle={{ fontWeight: '700' }} />
        </Appbar.Header>
        <ErrorState
          error={error?.response?.data?.message ?? 'Failed to load notices'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.Content title="Notices" titleStyle={{ fontWeight: '700' }} />
      </Appbar.Header>

      {isLoading ? (
        <View style={{ paddingTop: 16 }}>
          <SkeletonList count={5} />
        </View>
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="newspaper-outline"
              title="No notices"
              subtitle="Society notices from the admin will appear here."
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <NoticeCard notice={item} onPress={() => setSelectedNotice(item)} />
          )}
        />
      )}

      {/* Notice Detail Modal */}
      <Portal>
        <Modal
          visible={!!selectedNotice}
          onDismiss={() => setSelectedNotice(null)}
          contentContainerStyle={[styles.modal, { backgroundColor: colors.surface }]}
        >
          {selectedNotice && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Close button */}
              <View style={styles.modalHeader}>
                <Text variant="titleMedium" style={{ flex: 1, fontWeight: '700', color: colors.onSurface }}>
                  Notice Detail
                </Text>
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => setSelectedNotice(null)}
                />
              </View>

              <Divider />

              {/* Type chip */}
              {(() => {
                const cfg = TYPE_CONFIG[selectedNotice.type] ?? TYPE_CONFIG[NOTICE_TYPE.GENERAL];
                return (
                  <Chip
                    compact
                    icon={() => <Ionicons name={cfg.icon} size={12} color={cfg.color} />}
                    style={[styles.typeChip, { backgroundColor: cfg.color + '18' }]}
                    textStyle={{ color: cfg.color, fontWeight: '700' }}
                  >
                    {cfg.label}
                  </Chip>
                );
              })()}

              {/* Title */}
              <Text
                variant="titleLarge"
                style={[styles.modalTitle, { color: colors.onSurface }]}
              >
                {selectedNotice.title}
              </Text>

              {/* Date */}
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginLeft: 6 }}>
                  {selectedNotice.createdAt
                    ? new Date(selectedNotice.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })
                    : '—'}
                </Text>
              </View>

              <Divider style={{ marginVertical: 16 }} />

              {/* Content */}
              <Text variant="bodyMedium" style={{ color: colors.onSurface, lineHeight: 24 }}>
                {selectedNotice.content}
              </Text>
            </ScrollView>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  modal: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeChip: {
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 16,
    marginBottom: 8,
  },
  modalTitle: {
    fontWeight: '700',
    marginVertical: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});