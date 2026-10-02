import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { subscribeToActivityChanges } from '@/src/features/activities/activity-events';
import { getRefugeActivities } from '@/src/features/refuge/refuge-api';
import type { RefugeActivity } from '@/src/features/refuge/contracts';

type PlanningDataState = {
  activities: RefugeActivity[] | null;
  error: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
};

const INITIAL_STATE: PlanningDataState = {
  activities: null,
  error: false,
  isLoading: true,
  isRefreshing: false,
};

export function usePlanningData() {
  const [state, setState] = useState(INITIAL_STATE);
  const activeRequest = useRef<AbortController | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setState((current) => ({
      ...current,
      error: false,
      isLoading: mode === 'initial' && current.activities === null,
      isRefreshing: mode === 'refresh',
    }));
    try {
      const activities = await getRefugeActivities(controller.signal);
      if (controller.signal.aborted) return;
      setState({
        activities,
        error: false,
        isLoading: false,
        isRefreshing: false,
      });
    } catch {
      if (controller.signal.aborted) return;
      setState((current) => ({
        ...current,
        error: true,
        isLoading: false,
        isRefreshing: false,
      }));
    }
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => void load('initial'));
    return () => {
      cancelAnimationFrame(frame);
      activeRequest.current?.abort();
    };
  }, [load]);

  useEffect(
    () => subscribeToActivityChanges(() => void load('refresh')),
    [load],
  );

  return useMemo(
    () => ({
      ...state,
      refresh: () => load('refresh'),
      retry: () => load(state.activities ? 'refresh' : 'initial'),
    }),
    [load, state],
  );
}
