'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

/**
 * A ticking "now" that is safe to read during render.
 *
 * Calling `Date.now()` inside render or a `useMemo` makes the result depend on
 * when React happened to re-render, which React's compiler correctly rejects.
 * This exposes the clock as an external store instead: the timestamp only
 * advances when the interval fires, so every render within a tick sees the
 * same value, and anything derived from it — overdue badges, countdowns —
 * still refreshes on its own without a manual reload.
 *
 * Server renders return 0, and so does the first client render, so markup
 * matches during hydration. Treat 0 as "not known yet".
 */
class Clock {
  private listeners = new Set<() => void>();
  private timer: number | undefined;
  private snapshot = 0;

  constructor(private readonly intervalMs: number) {}

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      // First subscriber: publish the current time. React re-reads the
      // snapshot right after subscribing, so no notify is needed here.
      this.snapshot = Date.now();
      this.timer = window.setInterval(() => {
        this.snapshot = Date.now();
        this.listeners.forEach((notify) => notify());
      }, this.intervalMs);
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        window.clearInterval(this.timer);
        this.timer = undefined;
      }
    };
  };

  getSnapshot = () => this.snapshot;
}

/** One clock per interval, shared across every component that asks for it. */
const clocks = new Map<number, Clock>();

function clockFor(intervalMs: number): Clock {
  let clock = clocks.get(intervalMs);
  if (!clock) {
    clock = new Clock(intervalMs);
    clocks.set(intervalMs, clock);
  }
  return clock;
}

export function useNow(intervalMs = 60_000): number {
  const clock = useMemo(() => clockFor(intervalMs), [intervalMs]);
  const getServerSnapshot = useCallback(() => 0, []);
  return useSyncExternalStore(clock.subscribe, clock.getSnapshot, getServerSnapshot);
}
