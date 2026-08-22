'use client';

import { useCallback, useMemo } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { pushToast } from '@/features/ui/uiSlice';
import { normalizeApiError } from '@/lib/apiError';

/**
 * Thin wrapper over the toast slice. `toast.fromError` is the one every
 * `catch` block should use — it runs the API error through the normaliser so
 * users never see a raw axios message or a backend stack trace.
 */
export function useToast() {
  const dispatch = useAppDispatch();

  const success = useCallback(
    (title: string, description?: string) =>
      dispatch(pushToast({ title, description, variant: 'success' })),
    [dispatch],
  );

  const error = useCallback(
    (title: string, description?: string) =>
      dispatch(pushToast({ title, description, variant: 'error' })),
    [dispatch],
  );

  const warning = useCallback(
    (title: string, description?: string) =>
      dispatch(pushToast({ title, description, variant: 'warning' })),
    [dispatch],
  );

  const info = useCallback(
    (title: string, description?: string) =>
      dispatch(pushToast({ title, description, variant: 'info' })),
    [dispatch],
  );

  const fromError = useCallback(
    (caught: unknown, title = 'Something went wrong') => {
      const normalized = normalizeApiError(caught);
      dispatch(
        pushToast({
          title,
          description: normalized.message,
          variant: normalized.kind === 'ratelimit' ? 'warning' : 'error',
        }),
      );
      return normalized;
    },
    [dispatch],
  );

  return useMemo(
    () => ({ success, error, warning, info, fromError }),
    [success, error, warning, info, fromError],
  );
}
