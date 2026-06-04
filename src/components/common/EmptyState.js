// src/components/common/EmptyState.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

/**
 * @param {{ icon?: string, title: string, subtitle?: string, action?: React.ReactNode }} props
 */
export default function EmptyState({
  icon = 'folder-open-outline',
  title,
  subtitle,
  action,
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={colors.outlineVariant} />
      <Text
        variant="titleMedium"
        style={[styles.title, { color: colors.onSurface }]}
      >
        {title}
      </Text>
      {!!subtitle && (
        <Text
          variant="bodyMedium"
          style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
        >
          {subtitle}
        </Text>
      )}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  title: { textAlign: 'center', marginTop: 8 },
  subtitle: { textAlign: 'center' },
  action: { marginTop: 16 },
});
