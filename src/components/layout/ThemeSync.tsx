'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setTheme, type ThemePreference } from '@/features/ui/uiSlice';

const STORAGE_KEY = 'eventler.theme';

/**
 * Applies the theme preference to `<html>` and remembers it per browser.
 *
 * "system" follows the OS and keeps following it, so a user who changes their
 * OS appearance at dusk does not have to touch the app.
 */
export function ThemeSync() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);

  // Restore the saved preference before the first paint-relevant effect.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        dispatch(setTheme(stored));
      }
    } catch {
      /* storage blocked — fall back to "system" */
    }
  }, [dispatch]);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      root.classList.toggle('dark', dark);
      root.style.colorScheme = dark ? 'dark' : 'light';
    };

    apply();
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage blocked — the preference just won't persist */
    }

    if (theme !== 'system') return;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  return null;
}
