// src/hooks/useResidents.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { residentService } from '../api/services/residentService';
import { QUERY_KEYS } from '../constants';

/**
 * Fetch residents filtered by status.
 * @param {{ status?: 'pending'|'active'|'inactive', search?: string }} options
 */
export function useResidents({ status, search } = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.RESIDENTS(status),
    queryFn:  () => residentService.getResidents({ status, search, limit: 100 }),
    staleTime: 0,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

/** Fetch a single resident by ID */
export function useResident(id) {
  return useQuery({
    queryKey: QUERY_KEYS.RESIDENT(id),
    queryFn:  () => residentService.getResident(id),
    enabled:  !!id,
  });
}

/** Approve a pending resident */
export function useApproveResident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => residentService.approveResident(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

/** Reject a pending resident */
export function useRejectResident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, softDelete }) => residentService.rejectResident(id, softDelete),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

/** Deactivate an active resident */
export function useDeactivateResident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => residentService.deactivateResident(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}

/** Reactivate an inactive resident */
export function useReactivateResident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => residentService.reactivateResident(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['residents'] });
    },
  });
}