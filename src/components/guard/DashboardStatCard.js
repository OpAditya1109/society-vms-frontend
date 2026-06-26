// src/components/guard/DashboardStatCard.js
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardStatCard({ title, value, icon, color, subLabel, onPress }) {
  const { colors } = useTheme();
  const accent = color ?? '#E65100';
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper onPress={onPress} activeOpacity={0.75} style={styles.outer}>
      {/* Surface has borderRadius but NO overflow:hidden — keeps shadow intact on Android */}
      <Surface style={[styles.surface, { backgroundColor: colors.surface }]} elevation={2}>
        {/* Inner View carries overflow:hidden so the accent strip clips to the card's corners */}
        <View style={styles.clip}>
          <View style={[styles.strip, { backgroundColor: accent }]} />
          <View style={styles.inner}>
            <View style={[styles.iconWrap, { backgroundColor: accent + '18' }]}>
              <Ionicons name={icon} size={20} color={accent} />
            </View>
            <Text style={[styles.value, { color: accent }]} numberOfLines={1}>
              {value ?? '—'}
            </Text>
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {title}
            </Text>
            {!!subLabel && (
              <Text style={[styles.subLabel, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                {subLabel}
              </Text>
            )}
          </View>
        </View>
      </Surface>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    marginHorizontal: 4,
  },
  surface: {
    borderRadius: 14,
    // ← NO overflow: 'hidden' here — that kills Android shadow
  },
  clip: {
    borderRadius: 14,
    overflow: 'hidden', // ← overflow lives on a plain View, not Surface
  },
  strip: {
    height: 3,
    width: '100%',
  },
  inner: {
    padding: 12,
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  subLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});