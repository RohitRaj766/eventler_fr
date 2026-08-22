'use client';

import { useEffect, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { onSessionExpired } from '@/services/api';
import { sessionExpired } from '@/features/auth/authSlice';
import { pushToast } from '@/features/ui/uiSlice';
import { Toaster } from '@/components/ui/toast';
import { SessionBootstrap } from '@/components/auth/SessionBootstrap';
import { ThemeSync } from '@/components/layout/ThemeSync';

/**
 * Bridges the API layer's session-expiry broadcast into Redux.
 *
 * The axios interceptor cannot import the store (that would be a cycle), so it
 * publishes an event and this listener translates it into state.
 */
function SessionExpiryBridge() {
  useEffect(
    () =>
      onSessionExpired(() => {
        store.dispatch(sessionExpired());
        store.dispatch(
          pushToast({
            title: 'Signed out',
            description: 'Your session expired. Please sign in again.',
            variant: 'warning',
          }),
        );
      }),
    [],
  );
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <SessionExpiryBridge />
      <ThemeSync />
      <SessionBootstrap />
      {children}
      <Toaster />
    </Provider>
  );
}
