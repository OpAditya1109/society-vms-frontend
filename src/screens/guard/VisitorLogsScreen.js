// src/screens/guard/VisitorLogsScreen.js
import React, { useCallback, useState, useMemo } from 'react';
import {
  View, FlatList, StyleSheet,
  RefreshControl, ActivityIndicator,
  TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { Text, useTheme, Appbar, FAB, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useVisitorLogs, useCheckOutVisitor } from '../../hooks/useVisitorLogs';
import VisitorLogCard from '../../components/guard/VisitorLogCard';
import { SkeletonList } from '../../components/resident/SkeletonCard';
import { EmptyState, ErrorState } from '../../components/common';
import { SCREENS, VISITOR_STATUS } from '../../constants';

const GUARD_ACCENT = '#E65100';

function SearchBar({ value, onChange, colors }) {
  return (
    <View style={[searchStyles.wrap, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
      <Ionicons name="search-outline" size={18} color={colors.onSurfaceVariant} />
      <TextInput
        style={[searchStyles.input, { color: colors.onSurface }]}
        placeholder="Search by name, flat, mobile…"
        placeholderTextColor={colors.onSurfaceVariant}
        value={value}
        onChangeText={onChange}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const searchStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
});

function DateFilterBar({ fromDate, toDate, onFromDate, onToDate, colors }) {
  const [show, setShow] = useState(null); // 'from' | 'to' | null

  const fmt = (d) => d
    ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Any date';

  return (
    <View style={dateStyles.row}>
      <TouchableOpacity
        style={[dateStyles.btn, { backgroundColor: fromDate ? GUARD_ACCENT + '15' : '#F0F0F0', borderColor: fromDate ? GUARD_ACCENT : 'transparent', borderWidth: 1 }]}
        onPress={() => setShow('from')}
        activeOpacity={0.75}
      >
        <Ionicons name="calendar-outline" size={14} color={fromDate ? GUARD_ACCENT : '#555'} />
        <Text style={[dateStyles.btnText, { color: fromDate ? GUARD_ACCENT : '#555' }]}>
          From: {fmt(fromDate)}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[dateStyles.btn, { backgroundColor: toDate ? GUARD_ACCENT + '15' : '#F0F0F0', borderColor: toDate ? GUARD_ACCENT : 'transparent', borderWidth: 1 }]}
        onPress={() => setShow('to')}
        activeOpacity={0.75}
      >
        <Ionicons name="calendar-outline" size={14} color={toDate ? GUARD_ACCENT : '#555'} />
        <Text style={[dateStyles.btnText, { color: toDate ? GUARD_ACCENT : '#555' }]}>
          To: {fmt(toDate)}
        </Text>
      </TouchableOpacity>

      {(fromDate || toDate) && (
        <TouchableOpacity
          style={dateStyles.clearBtn}
          onPress={() => { onFromDate(null); onToDate(null); }}
          activeOpacity={0.75}
        >
          <Ionicons name="close-circle-outline" size={18} color="#C62828" />
        </TouchableOpacity>
      )}

      {show && (
        <DateTimePicker
          value={show === 'from' ? (fromDate ?? new Date()) : (toDate ?? new Date())}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, date) => {
            if (event.type === 'set' && date) {
              if (show === 'from') onFromDate(date);
              else onToDate(date);
            }
            setShow(null);
          }}
        />
      )}
    </View>
  );
}

const dateStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  btnText: { fontSize: 12, fontWeight: '600' },
  clearBtn: { marginLeft: 4 },
});

export default function VisitorLogsScreen({ navigation }) {
  const { colors } = useTheme();

  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVisitorLogs();

  const checkOutMutation = useCheckOutVisitor();

  const allVisitors = data?.pages?.flatMap((p) => p?.data ?? []) ?? [];

  // Client-side filtering on top of paginated data
  const visitors = useMemo(() => {
    let list = allVisitors;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (v) =>
          v.name?.toLowerCase().includes(q) ||
          v.mobile?.toLowerCase().includes(q) ||
          v.flatNumber?.toLowerCase().includes(q) ||
          v.purpose?.toLowerCase().includes(q)
      );
    }

    if (fromDate) {
      const from = new Date(fromDate); from.setHours(0, 0, 0, 0);
      list = list.filter((v) => new Date(v.createdAt) >= from);
    }

    if (toDate) {
      const to = new Date(toDate); to.setHours(23, 59, 59, 999);
      list = list.filter((v) => new Date(v.createdAt) <= to);
    }

    return list;
  }, [allVisitors, search, fromDate, toDate]);

  const onRefresh = useCallback(() => refetch(), [refetch]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleViewDetail = useCallback((visitor) => {
    navigation?.navigate?.(SCREENS.GUARD_VISITOR_DETAIL, { visitorId: visitor._id });
  }, [navigation]);

  const handleCheckOut = useCallback((visitor) => {
    Alert.alert(
      'Check Out Visitor',
      `Check out ${visitor.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check Out',
          style: 'destructive',
          onPress: () => checkOutMutation.mutate(visitor._id),
        },
      ]
    );
  }, [checkOutMutation]);

  const activeFiltersCount = [search, fromDate, toDate].filter(Boolean).length;

  if (isLoading) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
        <Header colors={colors} />
        <SkeletonList count={6} />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
        <Header colors={colors} />
        <ErrorState
          error={error?.response?.data?.message ?? 'Failed to load visitor logs'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header colors={colors} activeFiltersCount={activeFiltersCount} />

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} colors={colors} />

      {/* Date filter */}
      <DateFilterBar
        fromDate={fromDate}
        toDate={toDate}
        onFromDate={setFromDate}
        onToDate={setToDate}
        colors={colors}
      />

      {/* Results count */}
      {(search || fromDate || toDate) && (
        <Text style={[styles.resultCount, { color: colors.onSurfaceVariant }]}>
          {visitors.length} result{visitors.length !== 1 ? 's' : ''}
        </Text>
      )}

      <FlatList
        data={visitors}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <VisitorLogCardWithCheckout
            visitor={item}
            onPress={() => handleViewDetail(item)}
            onCheckOut={() => handleCheckOut(item)}
            isCheckingOut={checkOutMutation.isPending && checkOutMutation.variables === item._id}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            colors={[GUARD_ACCENT]}
            tintColor={GUARD_ACCENT}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={search || fromDate || toDate ? 'No matching logs' : 'No visitor logs'}
            subtitle={
              search || fromDate || toDate
                ? 'Try adjusting your filters.'
                : 'Logged visitors will appear here.'
            }
          />
        }
        ListFooterComponent={
          isFetchingNextPage
            ? <ActivityIndicator color={GUARD_ACCENT} style={{ marginVertical: 16 }} />
            : null
        }
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="account-plus-outline"
        label="Add Visitor"
        style={[styles.fab, { backgroundColor: GUARD_ACCENT }]}
        color="#fff"
        onPress={() => navigation?.navigate?.(SCREENS.GUARD_VISITOR_ENTRY)}
      />
    </SafeAreaView>
  );
}

// Wrapper card with checkout button shown for APPROVED (currently-in) visitors.
// Note: the backend checks visitors out from APPROVED status directly —
// there's no separate "checked in" state, so we key off APPROVED here.
function VisitorLogCardWithCheckout({ visitor, onPress, onCheckOut, isCheckingOut }) {
  const showCheckout = visitor.status === VISITOR_STATUS.APPROVED;

  return (
    <View>
      <VisitorLogCard visitor={visitor} onPress={onPress} squareBottom={showCheckout} />
      {showCheckout && (
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={onCheckOut}
          disabled={isCheckingOut}
          activeOpacity={0.8}
        >
          {isCheckingOut ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={15} color="#fff" />
              <Text style={styles.checkoutBtnText}>Check Out</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

function Header({ colors, activeFiltersCount }) {
  return (
    <Appbar.Header style={{ backgroundColor: colors.surface }}>
      <Appbar.Content title="Visitor Logs" titleStyle={{ fontWeight: '700' }} />
      {activeFiltersCount > 0 && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
        </View>
      )}
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  resultCount: { fontSize: 12, marginHorizontal: 16, marginBottom: 6 },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100 },
  fab: { position: 'absolute', right: 16, bottom: 24, borderRadius: 16 },
  filterBadge: {
    backgroundColor: GUARD_ACCENT,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1565C0',
    paddingVertical: 10,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  checkoutBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});