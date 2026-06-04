// src/components/common/LoadingScreen.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

/**
 * Full-screen loading indicator.
 * @param {{ message?: string }} props
 */
export default function LoadingScreen({ message = 'Loading…' }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {!!message && (
        <Text
          variant="bodyMedium"
          style={[styles.text, { color: colors.onSurfaceVariant }]}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    marginTop: 8,
  },
});
