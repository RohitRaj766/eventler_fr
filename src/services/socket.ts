'use client';

import { io, type Socket } from 'socket.io-client';

/**
 * Realtime transport.
 *
 * The backend mounts a Socket.IO server on the API origin and the handshake
 * succeeds with CORS credentials, but the deployed build does not currently
 * emit any application events and has no room-join acknowledgements. So this
 * module does two things:
 *
 *   1. speaks the protocol the backend is being built towards — one shared
 *      authenticated connection, org/program rooms, typed event names — so
 *      pushes light up the UI the moment the server starts sending them; and
 *   2. reports its own liveness through `onStatusChange`, which lets
 *      `useRealtimeChannel` fall back to polling while the socket is silent.
 *
 * There is exactly one connection per tab. Components subscribe and
 * unsubscribe; the socket itself is only torn down on sign-out.
 */

const SOCKET_URL = (
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'https://eventler.onrender.com'
).replace(/\/+$/, '');

/** Server-to-client events this client understands. */
export const REALTIME_EVENTS = {
  timelineUpdated: 'TIMELINE_UPDATED',
  scheduleChanged: 'SCHEDULE_CHANGED',
  nodeUpdated: 'NODE_UPDATED',
  nodeCreated: 'NODE_CREATED',
  nodeDeleted: 'NODE_DELETED',
  taskUpdated: 'TASK_UPDATED',
  taskCreated: 'TASK_CREATED',
  notification: 'NOTIFICATION',
  programStatusChanged: 'PROGRAM_STATUS_CHANGED',
} as const;

export type RealtimeEvent = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

type Listener = (payload: unknown) => void;
type StatusListener = (status: RealtimeStatus) => void;

class RealtimeClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private status: RealtimeStatus = 'idle';
  private statusListeners = new Set<StatusListener>();
  /** Rooms are refcounted so two panels watching one program share a join. */
  private rooms = new Map<string, number>();

  getStatus() {
    return this.status;
  }

  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(next: RealtimeStatus) {
    if (this.status === next) return;
    this.status = next;
    this.statusListeners.forEach((listener) => listener(next));
  }

  /** Idempotent. Reconnects with a new identity if the token changed. */
  connect(token: string | null) {
    if (this.socket && this.token === token) return;
    if (this.socket) this.disconnect();

    this.token = token;
    this.setStatus('connecting');

    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 15_000,
      timeout: 20_000,
    });

    this.socket.on('connect', () => {
      this.setStatus('connected');
      // Re-announce every room we were watching before the drop.
      this.rooms.forEach((_count, room) => this.socket?.emit('join', room));
    });

    this.socket.on('disconnect', () => this.setStatus('disconnected'));
    this.socket.io.on('reconnect_attempt', () => this.setStatus('connecting'));
    // Handshake failures are expected while the server-side gateway is
    // incomplete; the polling fallback covers it, so this stays quiet.
    this.socket.on('connect_error', () => this.setStatus('disconnected'));
  }

  disconnect() {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this.token = null;
    this.rooms.clear();
    this.setStatus('idle');
  }

  /** Joins a room, returning an unsubscribe that leaves once nobody is left. */
  joinRoom(room: string): () => void {
    const next = (this.rooms.get(room) ?? 0) + 1;
    this.rooms.set(room, next);
    if (next === 1) this.socket?.emit('join', room);

    return () => {
      const count = (this.rooms.get(room) ?? 1) - 1;
      if (count <= 0) {
        this.rooms.delete(room);
        this.socket?.emit('leave', room);
      } else {
        this.rooms.set(room, count);
      }
    };
  }

  on(event: RealtimeEvent, listener: Listener): () => void {
    this.socket?.on(event, listener);
    return () => {
      this.socket?.off(event, listener);
    };
  }
}

export const realtimeClient = new RealtimeClient();

export const roomFor = {
  program: (programId: string) => `program:${programId}`,
  organization: (orgId: string) => `org:${orgId}`,
  user: (userId: string) => `user:${userId}`,
};
