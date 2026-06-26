// src/screens/admin/GuardsManagementScreen.js
import React, { useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, FlatList } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useActiveGuards } from '../../hooks/useGuards';
import GuardCard from '../../components/admin/GuardCard';
import { ErrorState, SkeletonCard } from '../../components/common';

const GUARD_ACCENT = '#E65100';

/**
 * GuardsManagementScreen
 * 
 * Displays a list of all guards with their duty status
 * Allows admin to see which guards are active/on break/off duty
 * Tapping a guard navigates to their detail view
 */
export default function GuardsManagementScreen({ navigation }) {
  const { colors } = useTheme();
  const { data, isLoading, isError, error, refetch, isRefetching } = useActiveGuards();

  const onRefresh = useCallback(() => refetch(), [refetch]);

  const guards = data?.guards ?? data?.data?.guards ?? [];

  // Count guards by duty status
  const activeCount = guards.filter(g => g.dutyStatus === 'active').length;
  const breakCount = guards.filter(g => g.dutyStatus === 'onBreak').length;
  const offDutyCount = guards.filter(g => g.dutyStatus === 'inactive').length;

  const handleGuardPress = useCallback((guard) => {
    navigation?.navigate?.('GuardDetail', { guardId: guard._id, guard });
  }, [navigation]);

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Guards</Text>
          </View>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} height={140} style={{ marginVertical: 8 }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render error state
  if (isError) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.screen}>
        <ErrorState 
          error={error?.response?.data?.message ?? 'Failed to load guards'} 
          onRetry={refetch} 
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <FlatList
        data={guards}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.scroll}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <GuardCard 
            guard={item} 
            onPress={handleGuardPress}
          />
        )}
        ListHeaderComponent={() => (
          <>
            {/* Header with title and back button */}
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Guards Management</Text>
            </View>

            {/* Summary Stats */}
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { borderTopColor: '#4CAF50' }]}>
                <View style={[styles.statIconBox, { backgroundColor: '#4CAF50' + '15' }]}>
                  <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.statValue}>{activeCount}</Text>
                <Text style={styles.statLabel}>On Duty</Text>
              </View>
              <View style={[styles.statBox, { borderTopColor: '#FF9800' }]}>
                <View style={[styles.statIconBox, { backgroundColor: '#FF9800' + '15' }]}>
                  <Ionicons name="hourglass-outline" size={20} color="#FF9800" />
                </View>
                <Text style={styles.statValue}>{breakCount}</Text>
                <Text style={styles.statLabel}>On Break</Text>
              </View>
              <View style={[styles.statBox, { borderTopColor: '#9E9E9E' }]}>
                <View style={[styles.statIconBox, { backgroundColor: '#9E9E9E' + '15' }]}>
                  <Ionicons name="shield-outline" size={20} color="#9E9E9E" />
                </View>
                <Text style={styles.statValue}>{offDutyCount}</Text>
                <Text style={styles.statLabel}>Off Duty</Text>
              </View>
            </View>

            {/* List Title */}
            <Text style={styles.listTitle}>
              All Guards ({guards.length})
            </Text>
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No guards found</Text>
            <Text style={styles.emptySubtext}>Guards will appear here once added to the society</Text>
          </View>
        )}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={onRefresh} 
            colors={[GUARD_ACCENT]} 
            tintColor={GUARD_ACCENT}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: '#F5F3FF' 
  },
  scroll: { 
    paddingBottom: 40 
  },

  // Header
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderTopWidth: 3,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A2E',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#757575',
  },

  // List title
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9E9E9E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9E9E9E',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#BDBDBD',
    textAlign: 'center',
  },
});