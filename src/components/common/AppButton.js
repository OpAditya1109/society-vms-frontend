// src/components/common/AppButton.js
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, ActivityIndicator, useTheme } from 'react-native-paper';

/**
 * AppButton — wraps React Native Paper Button with loading state.
 *
 * @param {object}   props
 * @param {string}   props.label
 * @param {function} props.onPress
 * @param {boolean}  [props.loading=false]
 * @param {boolean}  [props.disabled=false]
 * @param {'contained'|'outlined'|'text'} [props.mode='contained']
 * @param {string}   [props.color]          Override button colour
 * @param {object}   [props.style]
 * @param {object}   [props.contentStyle]
 * @param {string}   [props.icon]
 * @param {'small'|'medium'|'large'} [props.size='medium']
 */
export default function AppButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  mode = 'contained',
  color,
  style,
  contentStyle,
  icon,
  size = 'medium',
  ...rest
}) {
  const { colors } = useTheme();

  const heightMap = { small: 40, medium: 50, large: 58 };
  const fontMap   = { small: 13, medium: 15, large: 16 };

  return (
    <Button
      mode={mode}
      onPress={onPress}
      disabled={disabled || loading}
      icon={loading ? undefined : icon}
      buttonColor={color ?? (mode === 'contained' ? colors.primary : undefined)}
      style={[styles.base, style]}
      contentStyle={[{ height: heightMap[size] }, contentStyle]}
      labelStyle={{ fontSize: fontMap[size], fontWeight: '600', letterSpacing: 0.5 }}
      {...rest}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator
            size="small"
            color={mode === 'contained' ? '#fff' : colors.primary}
          />
        </View>
      ) : (
        label
      )}
    </Button>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
  },
  loadingRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
