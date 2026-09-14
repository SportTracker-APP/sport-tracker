import { apiRequest } from '@/src/api/client';
import type {
  RefugeActivity,
  RefugeBadge,
  RefugeGoal,
  RefugeSummit,
} from '@/src/features/refuge/contracts';

async function getList<T>(
  path: `/${string}`,
  signal: AbortSignal,
): Promise<T[]> {
  const payload = await apiRequest<unknown>(path, { signal });

  if (!Array.isArray(payload)) {
    throw new Error(`Unexpected response for ${path}.`);
  }

  return payload as T[];
}

export function getRefugeActivities(signal: AbortSignal) {
  return getList<RefugeActivity>('/activities', signal);
}

export function getRefugeSummits(signal: AbortSignal) {
  return getList<RefugeSummit>('/summits', signal);
}

export function getRefugeBadges(signal: AbortSignal) {
  return getList<RefugeBadge>('/summits/badges', signal);
}

export function getRefugeGoals(signal: AbortSignal) {
  return getList<RefugeGoal>('/goals', signal);
}
