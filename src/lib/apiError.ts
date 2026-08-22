import axios from 'axios';
import type { NormalizedApiError, ValidationIssue } from '@/types';

/**
 * Turns anything thrown by the API layer into a shape screens can render.
 *
 * Two rules drive this file:
 *  - the user never sees an `AxiosError: Request failed with status code 403`
 *    or a backend stack trace, and
 *  - field-level Zod issues survive the trip so forms can highlight inputs.
 */

const STATUS_FALLBACKS: Record<number, string> = {
  400: 'That request was not valid. Please check the highlighted fields and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have permission to perform this action.",
  404: 'We could not find what you were looking for. It may have been deleted.',
  409: 'Someone else changed this while you were editing. Refresh to see the latest version.',
  422: 'Some of the information provided could not be processed.',
  429: 'Too many requests. Please wait a moment before trying again.',
  500: 'The server ran into a problem. Please try again shortly.',
  502: 'The server is unreachable right now. Please try again shortly.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
  504: 'The server took too long to respond. Please try again.',
};

function kindForStatus(status: number): NormalizedApiError['kind'] {
  if (status === 0) return 'network';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notfound';
  if (status === 409) return 'conflict';
  if (status === 429) return 'ratelimit';
  if (status === 400 || status === 422) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}

function isValidationIssueList(value: unknown): value is ValidationIssue[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === 'object' &&
    value[0] !== null &&
    'path' in (value[0] as object)
  );
}

/** Looks like a stack trace / internal dump rather than a user-facing sentence. */
function looksInternal(message: string): boolean {
  return (
    message.length > 300 ||
    /\bat\s+\w+\s+\(/.test(message) ||
    /^[A-Za-z]*Error:/.test(message) ||
    message.includes('node_modules') ||
    /prisma|sequelize|ECONNREFUSED|ETIMEDOUT/i.test(message)
  );
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  // Network failure, CORS rejection, or an aborted request.
  if (axios.isAxiosError(error) && !error.response) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    return {
      message: offline
        ? 'You appear to be offline. Check your connection and try again.'
        : 'Could not reach the Eventler server. Please check your connection and try again.',
      status: 0,
      kind: 'network',
      fieldErrors: {},
    };
  }

  if (axios.isAxiosError(error) && error.response) {
    const status = error.response.status;
    const body = error.response.data as
      | { message?: string; error?: unknown }
      | undefined;

    const fieldErrors: Record<string, string> = {};
    if (body && isValidationIssueList(body.error)) {
      for (const issue of body.error) {
        const field = issue.path?.join('.') ?? '';
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      }
    }

    let message = typeof body?.message === 'string' ? body.message.trim() : '';

    // "Validation Error" alone tells the user nothing — lead with the first
    // field problem instead.
    if ((!message || message === 'Validation Error') && Object.keys(fieldErrors).length) {
      message = Object.values(fieldErrors)[0];
    }

    if (!message || looksInternal(message)) {
      message = STATUS_FALLBACKS[status] ?? `Request failed (${status}).`;
    }

    return { message, status, kind: kindForStatus(status), fieldErrors };
  }

  if (error instanceof Error && error.message && !looksInternal(error.message)) {
    return { message: error.message, status: 0, kind: 'unknown', fieldErrors: {} };
  }

  return {
    message: 'Something went wrong. Please try again.',
    status: 0,
    kind: 'unknown',
    fieldErrors: {},
  };
}

/** Convenience for `catch` blocks that only need a sentence. */
export function getErrorMessage(error: unknown): string {
  return normalizeApiError(error).message;
}

/** True when the backend rejected a dependency for closing a cycle. */
export function isCycleError(error: unknown): boolean {
  const { message } = normalizeApiError(error);
  return /circular|cycle|acyclic|dag/i.test(message);
}

/** True when an optimistic-lock check failed (stale `version`). */
export function isVersionConflict(error: unknown): boolean {
  const normalized = normalizeApiError(error);
  return normalized.status === 409 || /stale|conflict|version/i.test(normalized.message);
}
