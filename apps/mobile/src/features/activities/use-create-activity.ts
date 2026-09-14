import { useEffect, useRef, useState } from 'react';

import { apiRequest, ApiError } from '@/src/api/client';
import type { CreateActivityPayload } from './activity-form-model';
import { notifyActivityChanged } from './activity-events';

export type SavedActivity = {
  id: string;
  title?: string | null;
  duration: number;
};

export function useCreateActivity() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [saved, setSaved] = useState<SavedActivity | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  const submit = async (payload: CreateActivityPayload) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError(null);
    setUncertain(false);
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 20_000);
    let confirmed = false;
    try {
      const result = await apiRequest<SavedActivity>('/activities', {
        method: 'POST',
        json: payload,
        signal: controller.signal,
      });
      if (!result || typeof result.id !== 'string' || !result.id)
        throw new Error('Missing activity confirmation');
      confirmed = true;
      if (mounted.current) {
        setSaved(result);
        notifyActivityChanged();
      }
    } catch (cause) {
      if (!mounted.current) return;
      if (
        cause instanceof ApiError &&
        cause.status >= 400 &&
        cause.status < 500
      ) {
        setError(
          cause.status === 401
            ? 'Ta session a expiré. Reconnecte-toi pour enregistrer ta sortie.'
            : cause.status === 429
              ? 'Trop de tentatives. Patiente un instant avant de réessayer.'
              : 'La sortie n’a pas été enregistrée. Vérifie les informations saisies et réessaie.',
        );
      } else {
        // A timeout or server failure does not prove that the POST was rolled back.
        setUncertain(true);
        setError(
          'Envoi non confirmé. Vérifie ton carnet avant de réessayer pour éviter un doublon.',
        );
        notifyActivityChanged();
      }
    } finally {
      clearTimeout(timeout);
      request.current = null;
      if (!confirmed) busy.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  const reset = () => {
    if (saving) return;
    busy.current = false;
    setSaved(null);
    setError(null);
    setUncertain(false);
  };

  return { submit, reset, saving, error, uncertain, saved };
}
