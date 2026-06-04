// src/hooks/useGuards.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { guardService } from '../api/services/guardService';
import { QUERY_KEYS } from '../constants';

/** Fetch all guards + duty status (resident, guard, admin) */
export function useActiveGuards() {
  return useQuery({
    queryKey: QUERY_KEYS.GUARDS,
    queryFn: () => guardService.getActiveGuards(),
    staleTime: 60 * 1000,
  });
}

/** Guard: update own duty status */
export function useUpdateGuardStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => guardService.updateStatus(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.GUARDS });
    },
  });
}

/** Resident: send message to a guard */
export function useSendGuardMessage() {
  return useMutation({
    mutationFn: ({ guardId, message }) => guardService.sendMessage(guardId, message),
  });
}

/** Guard: fetch received messages */
export function useGuardMessages() {
  return useQuery({
    queryKey: QUERY_KEYS.GUARD_MESSAGES,
    queryFn: () => guardService.getMessages(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // poll every 60s for new messages
  });
}

/** Guard: mark message as read */
export function useMarkMessageRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId) => guardService.markRead(messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.GUARD_MESSAGES });
    },
  });
}

/** Guard: reply to a resident message */
export function useReplyToMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, reply }) => guardService.replyToMessage(messageId, reply),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.GUARD_MESSAGES });
      Toast.show({ type: 'success', text1: 'Reply Sent', text2: 'Your reply was delivered.' });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message ?? 'Failed to send reply.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
}