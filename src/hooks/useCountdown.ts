'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Counts down in whole seconds — used for OTP resend cooldowns.
 *
 * Anchors on a wall-clock deadline rather than decrementing a counter, so the
 * remaining time stays correct when a background tab throttles its timers. The
 * clock is only ever read inside effects and callbacks, never during render.
 */
export function useCountdown(initialSeconds = 0) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const deadline = useRef<number>(0);

  useEffect(() => {
    if (initialSeconds > 0) deadline.current = Date.now() + initialSeconds * 1000;
  }, [initialSeconds]);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
    }, 500);
    return () => window.clearInterval(timer);
  }, [remaining]);

  const start = useCallback((seconds: number) => {
    deadline.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
  }, []);

  return { remaining, isRunning: remaining > 0, start };
}
