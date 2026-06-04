// src/components/common/DashboardCard.js
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

/**
 * DashboardCard — stat tile used across all role dashboards.
 *
 * @param {object}   props
 * @param {string}   props.title      Stat label
 * @param {string|number} props.value Stat value
 * @param {string}   props.icon       Ionicons icon name
 * @param {string}   [props.color]    Accent colour (defaults to theme primary)
 * @param {string}   [props.subtitle] Optional sub-label
 * @param {function} [props.onPress]
 */
export default function DashboardCard({
  title,
  value,
  icon,
  color,
  subtitle,
  onPress,
}) {
  const { colors } = useTheme();
  const accent = color ?? colors.primary;

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper onPress={onPress} activeOpacity={0.75} style={styles.outer}>
      <Surface style={[styles.surface, { backgroundColor: colors.surface }]} elevation={2}>
        {/* Accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accent }]} />

        <View style={styles.body}>
          <View style={[styles.iconCircle, { backgroundColor: accent + '20' }]}>
            <Ionicons name={icon} size={24} color={accent} />
          </View>

          <View style={styles.textGroup}>
            <Text
              variant="headlineMedium"
              style={[styles.value, { color: colors.onSurface }]}
            >
              {value ?? '—'}
            </Text>
            <Text
              variant="labelMedium"
              style={[styles.title, { color: colors.onSurfaceVariant }]}
            >
              {title}
            </Text>
            {!!subtitle && (
              <Text
                variant="bodySmall"
                style={{ color: colors.onSurfaceVariant, marginTop: 2 }}
              >
                {subtitle}
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
    minWidth: 140,
  },
  surface: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  body: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: { flex: 1 },
  value:  { fontWeight: '700', lineHeight: 36 },
  title:  { marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
});
