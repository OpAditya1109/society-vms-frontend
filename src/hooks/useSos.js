// src/hooks/useSos.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { sosService } from '../api/services/sosService';

const ALERTS_KEY = ['sos-alerts'];
const MY_KEY     = ['sos-my'];

export function useSosAlerts() {
  return useQuery({ queryKey: ALERTS_KEY, queryFn: () => sosService.getAlerts(), refetchInterval: 15000 });
}

export function useMySosAlerts() {
  return useQuery({ queryKey: MY_KEY, queryFn: () => sosService.myAlerts() });
}

export function useTriggerSos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message) => sosService.trigger(message),
    onSuccess: () => { qc.invalidateQueries({ queryKey: MY_KEY }); },
  });
}

export function useAcknowledgeSos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => sosService.acknowledge(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ALERTS_KEY }); Toast.show({ type: 'success', text1: 'Alert Acknowledged' }); },
  });
}

export function useResolveSos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => sosService.resolve(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ALERTS_KEY }); Toast.show({ type: 'success', text1: 'Alert Resolved' }); },
  });
}   