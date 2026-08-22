/**
 * Session token storage.
 *
 * The backend hands out three things on login: an access token (15 min),
 * a refresh token, and HttpOnly `eventler_at` / `eventler_rt` cookies.
 *
 * Those cookies are set `SameSite=Lax` without `Secure`, so a browser will not
 * attach them to cross-site XHR — with the SPA on a different origin from the
 * API they are effectively unusable. We therefore keep the body-issued tokens
 * ourselves. To limit the blast radius:
 *
 *   - the access token lives in memory, mirrored to sessionStorage only so a
 *     page reload in the same tab does not bounce the user to /login;
 *   - the refresh token lives in sessionStorage, never localStorage, so it
 *     dies with the tab and is not shared across the origin's other tabs;
 *   - nothing is ever written to a non-HttpOnly cookie.
 *
 * Requests still go out with `withCredentials: true`, so once the API is
 * served same-site (or switches to `SameSite=None; Secure`) the HttpOnly
 * cookies take over and the stored refresh token becomes a fallback only.
 */

const ACCESS_KEY = 'eventler.at';
const REFRESH_KEY = 'eventler.rt';
const ORG_KEY = 'eventler.org';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let activeOrgId: string | null = null;
let hydrated = false;

function session(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    // Private mode / blocked site data.
    return null;
  }
}

function read(key: string): string | null {
  try {
    return session()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  const store = session();
  if (!store) return;
  try {
    if (value) store.setItem(key, value);
    else store.removeItem(key);
  } catch {
    /* storage full or blocked — in-memory copy still works for this page */
  }
}

/** Pulls persisted values into memory once, on first client-side access. */
function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  accessToken = read(ACCESS_KEY);
  refreshToken = read(REFRESH_KEY);
  activeOrgId = read(ORG_KEY);
}

export function getAccessToken(): string | null {
  hydrate();
  return accessToken;
}

export function setAccessToken(token: string | null) {
  hydrate();
  accessToken = token;
  write(ACCESS_KEY, token);
}

export function getRefreshToken(): string | null {
  hydrate();
  return refreshToken;
}

export function setRefreshToken(token: string | null) {
  hydrate();
  refreshToken = token;
  write(REFRESH_KEY, token);
}

export function getActiveOrgId(): string | null {
  hydrate();
  return activeOrgId;
}

export function setActiveOrgId(orgId: string | null) {
  hydrate();
  activeOrgId = orgId;
  write(ORG_KEY, orgId);
}

/** Wipes every trace of the session from this tab. */
export function clearSession() {
  hydrate();
  accessToken = null;
  refreshToken = null;
  activeOrgId = null;
  write(ACCESS_KEY, null);
  write(REFRESH_KEY, null);
  write(ORG_KEY, null);
}

/** True when this tab has something worth trying to restore a session with. */
export function hasStoredSession(): boolean {
  hydrate();
  return Boolean(accessToken || refreshToken);
}
