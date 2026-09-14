import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { subscribeToActivityChanges } from '@/src/features/activities/activity-events';

import type {
  RefugeActivity,
  RefugeBadge,
  RefugeGoal,
  RefugeResourceKey,
  RefugeSummit,
} from '@/src/features/refuge/contracts';
import {
  getRefugeActivities,
  getRefugeBadges,
  getRefugeGoals,
  getRefugeSummits,
} from '@/src/features/refuge/refuge-api';

type RefugeDataState = {
  activities: RefugeActivity[] | null;
  badges: RefugeBadge[] | null;
  errors: RefugeResourceKey[];
  goals: RefugeGoal[] | null;
  isLoading: boolean;
  isRefreshing: boolean;
  summits: RefugeSummit[] | null;
};

const INITIAL_STATE: RefugeDataState = {
  activities: null,
  badges: null,
  errors: [],
  goals: null,
  isLoading: true,
  isRefreshing: false,
  summits: null,
};

function getRejectedResources(results: {
  activities: PromiseSettledResult<RefugeActivity[]>;
  badges: PromiseSettledResult<RefugeBadge[]>;
  goals: PromiseSettledResult<RefugeGoal[]>;
  summits: PromiseSettledResult<RefugeSummit[]>;
}): RefugeResourceKey[] {
  const errors: RefugeResourceKey[] = [];

  if (results.activities.status === 'rejected') errors.push('activities');
  if (results.badges.status === 'rejected') errors.push('badges');
  if (results.goals.status === 'rejected') errors.push('goals');
  if (results.summits.status === 'rejected') errors.push('summits');

  return errors;
}

export function useRefugeData() {
  const [state, setState] = useState<RefugeDataState>(INITIAL_STATE);
  const activeRequest = useRef<AbortController | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;

    setState((current) => ({
      ...current,
      errors: [],
      isLoading:
        mode === 'initial' ||
        [
          current.activities,
          current.summits,
          current.badges,
          current.goals,
        ].every((resource) => resource === null),
      isRefreshing: mode === 'refresh',
    }));

    const [activities, summits, badges, goals] = await Promise.allSettled([
      getRefugeActivities(controller.signal),
      getRefugeSummits(controller.signal),
      getRefugeBadges(controller.signal),
      getRefugeGoals(controller.signal),
    ]);

    if (controller.signal.aborted) {
      return;
    }

    const results = { activities, badges, goals, summits };

    setState((current) => ({
      activities:
        activities.status === 'fulfilled'
          ? activities.value
          : current.activities,
      badges: badges.status === 'fulfilled' ? badges.value : current.badges,
      errors: getRejectedResources(results),
      goals: goals.status === 'fulfilled' ? goals.value : current.goals,
      isLoading: false,
      isRefreshing: false,
      summits: summits.status === 'fulfilled' ? summits.value : current.summits,
    }));
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

  const hasAnyData =
    state.activities !== null ||
    state.badges !== null ||
    state.goals !== null ||
    state.summits !== null;

  return useMemo(
    () => ({
      ...state,
      hasAnyData,
      refresh: () => load('refresh'),
      retry: () => load(hasAnyData ? 'refresh' : 'initial'),
    }),
    [hasAnyData, load, state],
  );
}
