// src/components/common/AppInput.js
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, HelperText, useTheme } from 'react-native-paper';

/**
 * AppInput — React Native Paper TextInput with inline error support.
 *
 * @param {object}   props
 * @param {string}   props.label
 * @param {string}   props.value
 * @param {function} props.onChangeText
 * @param {string}   [props.error]         Validation error message
 * @param {boolean}  [props.secureText]    Toggle password visibility
 * @param {string}   [props.left]          Left icon name (Ionicons)
 * @param {string}   [props.keyboardType]
 * @param {boolean}  [props.disabled]
 * @param {object}   [props.style]
 */
export default function AppInput({
  label,
  value,
  onChangeText,
  error,
  secureText = false,
  left,
  keyboardType,
  disabled = false,
  style,
  ...rest
}) {
  const { colors } = useTheme();
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        mode="outlined"
        disabled={disabled}
        keyboardType={keyboardType}
        secureTextEntry={secureText && !isPasswordVisible}
        error={!!error}
        outlineColor={colors.outline}
        activeOutlineColor={colors.primary}
        style={styles.input}
        outlineStyle={{ borderRadius: 12 }}
        left={left ? <TextInput.Icon icon={left} /> : undefined}
        right={
          secureText ? (
            <TextInput.Icon
              icon={isPasswordVisible ? 'eye-off' : 'eye'}
              onPress={() => setPasswordVisible((v) => !v)}
            />
          ) : undefined
        }
        {...rest}
      />
      {!!error && (
        <HelperText type="error" visible padding="none">
          {error}
        </HelperText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'transparent',
  },
});
