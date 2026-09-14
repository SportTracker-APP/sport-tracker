import { useCallback, useEffect, useRef, useState } from 'react';

import { apiRequest } from '@/src/api/client';
import { subscribeToActivityChanges } from '@/src/features/activities/activity-events';
import type { Summit } from './explore-model';

export function useExploreData() {
  const [summits, setSummits] = useState<Summit[] | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const request = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(false);
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const payload = await apiRequest<unknown>('/summits', {
        signal: controller.signal,
      });
      if (
        !Array.isArray(payload) ||
        !payload.every(
          (item) =>
            item &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.discovered === 'boolean',
        )
      ) {
        throw new Error('Invalid summit catalog');
      }
      if (request.current === controller && !controller.signal.aborted)
        setSummits(payload as Summit[]);
    } catch {
      if (request.current === controller) setError(true);
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => void refresh());
    return () => {
      cancelAnimationFrame(frame);
      const pending = request.current;
      request.current = null;
      pending?.abort();
    };
  }, [refresh]);

  useEffect(() => subscribeToActivityChanges(() => void refresh()), [refresh]);

  return { summits, error, loading, refresh };
}
