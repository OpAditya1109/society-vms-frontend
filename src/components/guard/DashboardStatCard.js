// src/components/guard/DashboardStatCard.js
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

/**
 * DashboardStatCard — wide stat card for guard dashboard.
 *
 * @param {string}        props.title
 * @param {string|number} props.value
 * @param {string}        props.icon       Ionicons name
 * @param {string}        [props.color]    Accent colour
 * @param {string}        [props.subLabel] Secondary info line
 * @param {function}      [props.onPress]
 */
export default function DashboardStatCard({ title, value, icon, color, subLabel, onPress }) {
  const { colors } = useTheme();
  const accent = color ?? '#E65100';
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper onPress={onPress} activeOpacity={0.75} style={styles.outer}>
      <Surface style={[styles.surface, { backgroundColor: colors.surface }]} elevation={2}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: accent + '1A' }]}>
            <Ionicons name={icon} size={26} color={accent} />
          </View>
          <View style={styles.textBlock}>
            <Text variant="displaySmall" style={[styles.value, { color: accent }]}>
              {value ?? '—'}
            </Text>
            <Text variant="labelMedium" style={[styles.label, { color: colors.onSurfaceVariant }]}>
              {title}
            </Text>
            {!!subLabel && (
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, marginTop: 2 }}>
                {subLabel}
              </Text>
            )}
          </View>
        </View>
        <View style={[styles.bar, { backgroundColor: accent }]} />
      </Surface>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  surface: {
    borderRadius: 16,
    padding: 18,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  value: { fontWeight: '800', lineHeight: 40 },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
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