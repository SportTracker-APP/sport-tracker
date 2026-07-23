'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getSummitBadges,
  getSummits,
  removeSummitFromDiscoveries,
  updateSummitDiscovery,
} from '@/lib/summit-api';

export function useSummits() {
  return useQuery({
    queryKey: ['summits'],
    queryFn: getSummits,
  });
}

export function useSummitBadges() {
  return useQuery({
    queryKey: ['summit-badges'],
    queryFn: getSummitBadges,
  });
}

export function useUpdateSummitDiscovery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      discoveryId,
      status,
    }: {
      discoveryId: string;
      status: 'CONFIRMED' | 'DISMISSED';
    }) => updateSummitDiscovery(discoveryId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['summits'] });
      void queryClient.invalidateQueries({ queryKey: ['summit-badges'] });
    },
  });
}

export function useRemoveSummitDiscovery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeSummitFromDiscoveries,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['summits'] });
      void queryClient.invalidateQueries({ queryKey: ['summit-badges'] });
    },
  });
}
