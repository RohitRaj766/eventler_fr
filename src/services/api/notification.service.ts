import type { AppNotification } from '@/types';
import { apiGet, apiPatch } from './axiosInstance';

/**
 * Read-state fallback.
 *
 * The backend exposes only `GET /notifications/my`. Swagger advertises
 * `PATCH /notifications/{id}/read`, but no such route is deployed (every
 * method/path variant returns Express' "Cannot PATCH"). Until it ships we
 * try the documented call and, when it 404s, fall back to a per-user read set
 * in localStorage so the badge and the inbox still behave correctly.
 */

const READ_KEY_PREFIX = 'eventler.notifications.read.';

function readKey(userId: string) {
  return `${READ_KEY_PREFIX}${userId}`;
}

function loadLocalReadIds(userId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(readKey(userId));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveLocalReadIds(userId: string, ids: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    // Keep the list bounded so it cannot grow without limit.
    window.localStorage.setItem(readKey(userId), JSON.stringify([...ids].slice(-500)));
  } catch {
    /* storage unavailable — read state is best-effort */
  }
}

/** True when the server has no mark-as-read route (so we stop retrying it). */
let serverReadUnsupported = false;

export const notificationService = {
  /** Path is `/notifications/my`; Swagger's `/my-notifications` 404s. */
  async list(userId: string) {
    const notifications = (await apiGet<AppNotification[]>('/notifications/my')) ?? [];
    const locallyRead = loadLocalReadIds(userId);
    return notifications.map((notification) => ({
      ...notification,
      isRead: notification.isRead ?? locallyRead.has(notification.id),
    }));
  },

  async markAsRead(userId: string, notificationId: string) {
    if (!serverReadUnsupported) {
      try {
        await apiPatch<null>(`/notifications/${notificationId}/read`);
        return { persistedRemotely: true };
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status !== 404) throw error;
        serverReadUnsupported = true;
      }
    }

    const ids = loadLocalReadIds(userId);
    ids.add(notificationId);
    saveLocalReadIds(userId, ids);
    return { persistedRemotely: false };
  },

  async markAllAsRead(userId: string, notificationIds: string[]) {
    const ids = loadLocalReadIds(userId);
    let persistedRemotely = true;
    for (const id of notificationIds) {
      const result = await this.markAsRead(userId, id).catch(() => ({
        persistedRemotely: false,
      }));
      if (!result.persistedRemotely) {
        persistedRemotely = false;
        ids.add(id);
      }
    }
    if (!persistedRemotely) saveLocalReadIds(userId, ids);
    return { persistedRemotely };
  },
};
