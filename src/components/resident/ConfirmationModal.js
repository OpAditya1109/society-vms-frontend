// src/components/resident/ConfirmationModal.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, useTheme, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

/**
 * ConfirmationModal — reusable confirm/cancel dialog.
 *
 * @param {object}   props
 * @param {boolean}  props.visible
 * @param {string}   props.title
 * @param {string}   props.message
 * @param {string}   [props.confirmLabel='Confirm']
 * @param {string}   [props.cancelLabel='Cancel']
 * @param {string}   [props.confirmColor]     Override confirm button colour
 * @param {string}   [props.icon]             Ionicons icon name shown in header
 * @param {boolean}  [props.loading=false]    Disables buttons while action runs
 * @param {function} props.onConfirm
 * @param {function} props.onDismiss
 */
export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor,
  icon,
  loading = false,
  onConfirm,
  onDismiss,
}) {
  const { colors } = useTheme();
  const accent = confirmColor ?? colors.primary;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={loading ? undefined : onDismiss}
        contentContainerStyle={[styles.container, { backgroundColor: colors.surface }]}
      >
        {/* Icon */}
        {icon && (
          <View style={[styles.iconWrap, { backgroundColor: accent + '18' }]}>
            <Ionicons name={icon} size={28} color={accent} />
          </View>
        )}

        {/* Title */}
        <Text variant="titleMedium" style={[styles.title, { color: colors.onSurface }]}>
          {title}
        </Text>

        {/* Message */}
        <Text variant="bodyMedium" style={[styles.message, { color: colors.onSurfaceVariant }]}>
          {message}
        </Text>

        <Divider style={styles.divider} />

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            disabled={loading}
            style={styles.btn}
            labelStyle={{ fontWeight: '600' }}
          >
            {cancelLabel}
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            loading={loading}
            disabled={loading}
            buttonColor={accent}
            style={styles.btn}
            labelStyle={{ fontWeight: '600' }}
          >
            {confirmLabel}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 24,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
  },
  divider: {
    marginVertical: 20,
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    borderRadius: 12,
  },
});