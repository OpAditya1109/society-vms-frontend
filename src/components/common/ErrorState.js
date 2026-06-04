// src/components/common/ErrorState.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AppButton from './AppButton';

/**
 * @param {{ error?: Error|string, onRetry?: function, title?: string }} props
 */
export default function ErrorState({
  error,
  onRetry,
  title = 'Something went wrong',
}) {
  const { colors } = useTheme();

  const message =
    typeof error === 'string'
      ? error
      : error?.response?.data?.message ?? error?.message ?? 'An unexpected error occurred.';

  return (
    <View style={styles.container}>
      <Ionicons name="warning-outline" size={64} color={colors.error} />
      <Text
        variant="titleMedium"
        style={[styles.title, { color: colors.onSurface }]}
      >
        {title}
      </Text>
      <Text
        variant="bodyMedium"
        style={[styles.message, { color: colors.onSurfaceVariant }]}
      >
        {message}
      </Text>
      {onRetry && (
        <AppButton
          label="Try Again"
          onPress={onRetry}
          mode="outlined"
          style={styles.retryBtn}
        />
      )}
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
  title:    { textAlign: 'center', marginTop: 8 },
  message:  { textAlign: 'center' },
  retryBtn: { marginTop: 16 },
});
