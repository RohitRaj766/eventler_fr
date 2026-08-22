'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import {
  realtimeClient,
  roomFor,
  type RealtimeEvent,
  type RealtimeStatus,
} from '@/services/socket';
import { getAccessToken } from '@/services/api';

/** Current transport health, for the header indicator. */
export function useRealtimeStatus(): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>(realtimeClient.getStatus());
  useEffect(() => realtimeClient.onStatusChange(setStatus), []);
  return status;
}

/**
 * Opens the single shared socket for the signed-in user and closes it on
 * sign-out. Mounted once, in the dashboard layout.
 */
export function useRealtimeConnection() {
  const status = useAppSelector((state) => state.auth.status);
  const userId = useAppSelector((state) => state.auth.user?.id);

  useEffect(() => {
    if (status !== 'authenticated') {
      realtimeClient.disconnect();
      return;
    }
    realtimeClient.connect(getAccessToken());
    return () => {
      // Deliberately not disconnecting on unmount: the connection is shared
      // across the whole authenticated shell and torn down at sign-out.
    };
  }, [status, userId]);
}

/** Joins a room for as long as the component is mounted. */
export function useRealtimeRoom(room: string | null) {
  const status = useRealtimeStatus();
  useEffect(() => {
    if (!room || status !== 'connected') return;
    return realtimeClient.joinRoom(room);
  }, [room, status]);
}

/** Subscribes to one server event with a stable handler reference. */
export function useRealtimeEvent<T = unknown>(
  event: RealtimeEvent,
  handler: (payload: T) => void,
  enabled = true,
) {
  const status = useRealtimeStatus();
  // Kept in a ref so a new inline handler each render does not resubscribe.
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || status !== 'connected') return;
    return realtimeClient.on(event, (payload) => handlerRef.current(payload as T));
  }, [event, enabled, status]);
}

/**
 * Keeps a view fresh whether or not the socket is delivering.
 *
 * The deployed backend accepts socket connections but does not emit events
 * yet, so a live event view that relied on pushes alone would sit still.
 * This polls on an interval while realtime is down, backs off to a slow
 * heartbeat once it is up, and pauses entirely when the tab is hidden so a
 * forgotten background tab does not burn through the 300-request rate limit.
 */
export function useRealtimeChannel({
  room,
  refresh,
  intervalMs = 20_000,
  connectedIntervalMs = 120_000,
  enabled = true,
}: {
  room: string | null;
  refresh: () => void;
  intervalMs?: number;
  connectedIntervalMs?: number;
  enabled?: boolean;
}) {
  const status = useRealtimeStatus();
  // Same reason as above: the interval must not restart on every render.
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useRealtimeRoom(enabled ? room : null);

  useEffect(() => {
    if (!enabled) return;

    const period = status === 'connected' ? connectedIntervalMs : intervalMs;
    let timer: number | undefined;

    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        if (document.visibilityState === 'visible') refreshRef.current();
      }, period);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Catch up immediately on return rather than waiting a full period.
        refreshRef.current();
        start();
      } else {
        window.clearInterval(timer);
      }
    };

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, status, intervalMs, connectedIntervalMs]);

  return status;
}

export { roomFor };
