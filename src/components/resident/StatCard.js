// src/components/resident/StatCard.js
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

/**
 * StatCard — compact stat tile for the resident dashboard.
 *
 * @param {object}        props
 * @param {string}        props.title     Label below the number
 * @param {string|number} props.value     Big number displayed
 * @param {string}        props.icon      Ionicons icon name
 * @param {string}        [props.color]   Accent colour
 * @param {function}      [props.onPress]
 */
export default function StatCard({ title, value, icon, color, onPress }) {
  const { colors } = useTheme();
  const accent = color ?? colors.primary;
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper onPress={onPress} activeOpacity={0.75} style={styles.outer}>
      <Surface style={[styles.surface, { backgroundColor: colors.surface }]} elevation={2}>
        <View style={[styles.iconWrap, { backgroundColor: accent + '1A' }]}>
          <Ionicons name={icon} size={22} color={accent} />
        </View>
        <Text variant="headlineMedium" style={[styles.value, { color: colors.onSurface }]}>
          {value ?? '—'}
        </Text>
        <Text variant="labelSmall" style={[styles.label, { color: colors.onSurfaceVariant }]}>
          {title}
        </Text>
        <View style={[styles.bar, { backgroundColor: accent }]} />
      </Surface>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, minWidth: '45%' },
  surface: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: { fontWeight: '700', lineHeight: 32 },
  label: {
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});