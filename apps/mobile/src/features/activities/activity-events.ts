// A payload-free invalidation signal; no account data or persistent cache.
const listeners = new Set<() => void>();

export function subscribeToActivityChanges(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyActivityChanged() {
  listeners.forEach((listener) => listener());
}
