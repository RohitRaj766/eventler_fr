import type {
  EventNode,
  NodeStatus,
  NodeTypeCategory,
  ProgramStatus,
  TaskPriority,
  TaskStatus,
} from '@/types';

/* ------------------------------------------------------------------ */
/* Dates & durations                                                   */
/* ------------------------------------------------------------------ */

/** "2027-03-01" — a calendar day with no time or zone attached. */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  // `new Date("2027-03-01")` is parsed as UTC midnight, which renders as the
  // previous day for anyone west of UTC — a date input reading 1 Mar would
  // display as 28 Feb in New York. A bare calendar day means a *local* day, so
  // build it from its parts instead of letting the string parser decide.
  if (DATE_ONLY.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const local = new Date(year, month - 1, day);
    return Number.isNaN(local.getTime()) ? null : local;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value?: string | Date | null, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Kept for existing call sites. */
export const formatDate = formatDateTime;

export function formatDateOnly(value?: string | Date | null, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTimeOnly(value?: string | Date | null, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** "1h 30m", "45m", "0m" — for durations expressed in minutes. */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function durationBetween(start?: string | null, end?: string | null): number {
  const from = toDate(start);
  const to = toDate(end);
  if (!from || !to) return 0;
  return Math.round((to.getTime() - from.getTime()) / 60_000);
}

/** "in 5m", "2h ago", "just now". */
export function formatRelativeTime(value?: string | Date | null, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;

  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  const abs = Math.abs(diffMin);

  if (abs < 1) return 'just now';
  if (abs < 60) return diffMin > 0 ? `in ${abs}m` : `${abs}m ago`;
  if (abs < 60 * 24) {
    const hours = Math.round(abs / 60);
    return diffMin > 0 ? `in ${hours}h` : `${hours}h ago`;
  }
  const days = Math.round(abs / (60 * 24));
  if (days < 30) return diffMin > 0 ? `in ${days}d` : `${days}d ago`;
  return formatDateOnly(date);
}

/** `<input type="datetime-local">` wants local wall time, not an ISO Z string. */
export function toDateTimeLocalValue(value?: string | Date | null): string {
  const date = toDate(value);
  if (!date) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** Converts a datetime-local value back into the ISO string the API expects. */
export function fromDateTimeLocalValue(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * Split date/time helpers.
 *
 * Nodes are almost always scheduled on a day their parent already covers, so
 * the forms ask for a date once and then only for times. These convert between
 * that split representation and the ISO instants the API stores.
 */

/** `<input type="date">` value in local time — "2027-03-01". */
export function toDateInputValue(value?: string | Date | null): string {
  const date = toDate(value);
  if (!date) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** `<input type="time">` value in local time — "10:00". */
export function toTimeInputValue(value?: string | Date | null): string {
  const date = toDate(value);
  if (!date) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Recombines a date and a time into an ISO instant.
 *
 * `dayOffset` lets an end time that reads as earlier than its start roll onto
 * the following day, so a session running 23:00–00:30 is expressible without
 * asking for a second date.
 */
export function combineDateAndTime(
  date: string,
  time: string,
  dayOffset = 0,
): string | undefined {
  if (!date || !time) return undefined;
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  if ([year, month, day, hours, minutes].some((part) => Number.isNaN(part))) return undefined;

  const combined = new Date(year, month - 1, day + dayOffset, hours, minutes, 0, 0);
  return Number.isNaN(combined.getTime()) ? undefined : combined.toISOString();
}

/** True when an end time reads as earlier than its start, i.e. it crosses midnight. */
export function crossesMidnight(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;
  return endTime <= startTime;
}

/** Minutes between two "HH:MM" values, rolling past midnight when needed. */
export function minutesBetweenTimes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const toMinutes = (value: string) => {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  };
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  return end > start ? end - start : end + 24 * 60 - start;
}

/** Weekday + date, e.g. "Mon, 1 Mar 2027" — for confirming an inherited date. */
export function formatDayLabel(value?: string | Date | null, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/* Status vocabulary                                                   */
/* ------------------------------------------------------------------ */

/**
 * Every status carries a shape/icon cue alongside its colour, so the state is
 * still readable without colour vision — see `StatusBadge`.
 */
export interface StatusTone {
  /** Tailwind classes for a bordered pill. */
  className: string;
  /** Solid dot colour for compact indicators. */
  dot: string;
  label: string;
}

const NEUTRAL: StatusTone = {
  className: 'bg-muted text-muted-foreground border-border',
  dot: 'bg-muted-foreground',
  label: 'Unknown',
};

const NODE_STATUS_TONES: Record<NodeStatus, StatusTone> = {
  SCHEDULED: {
    className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-600',
    dot: 'bg-slate-400',
    label: 'Scheduled',
  },
  READY: {
    className: 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-700',
    dot: 'bg-cyan-500',
    label: 'Ready',
  },
  IN_PROGRESS: {
    className: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700',
    dot: 'bg-blue-500',
    label: 'In progress',
  },
  DELAYED: {
    className: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700',
    dot: 'bg-amber-500',
    label: 'Delayed',
  },
  COMPLETED: {
    className: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Completed',
  },
  CANCELLED: {
    className: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-700',
    dot: 'bg-red-500',
    label: 'Cancelled',
  },
  SKIPPED: {
    className: 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-600',
    dot: 'bg-zinc-400',
    label: 'Skipped',
  },
};

const PROGRAM_STATUS_TONES: Record<ProgramStatus, StatusTone> = {
  DRAFT: NODE_STATUS_TONES.SCHEDULED,
  PLANNED: {
    className: 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-700',
    dot: 'bg-indigo-500',
    label: 'Planned',
  },
  PUBLISHED: {
    className: 'bg-violet-50 text-violet-800 border-violet-300 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-700',
    dot: 'bg-violet-500',
    label: 'Published',
  },
  LIVE: {
    className: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-700',
    dot: 'bg-red-500',
    label: 'Live',
  },
  PAUSED: NODE_STATUS_TONES.DELAYED,
  COMPLETED: NODE_STATUS_TONES.COMPLETED,
  CANCELLED: NODE_STATUS_TONES.CANCELLED,
};

const TASK_STATUS_TONES: Record<TaskStatus, StatusTone> = {
  PENDING: NODE_STATUS_TONES.SCHEDULED,
  IN_PROGRESS: NODE_STATUS_TONES.IN_PROGRESS,
  READY: NODE_STATUS_TONES.READY,
  COMPLETED: NODE_STATUS_TONES.COMPLETED,
  BLOCKED: NODE_STATUS_TONES.DELAYED,
  CANCELLED: NODE_STATUS_TONES.CANCELLED,
};

const TASK_PRIORITY_TONES: Record<TaskPriority, StatusTone> = {
  LOW: { className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-600', dot: 'bg-slate-400', label: 'Low' },
  MEDIUM: { className: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-700', dot: 'bg-sky-500', label: 'Medium' },
  HIGH: { className: 'bg-orange-50 text-orange-900 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-700', dot: 'bg-orange-500', label: 'High' },
  URGENT: { className: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-700', dot: 'bg-red-500', label: 'Urgent' },
};

export function nodeStatusTone(status?: string | null): StatusTone {
  return NODE_STATUS_TONES[status as NodeStatus] ?? NEUTRAL;
}
export function programStatusTone(status?: string | null): StatusTone {
  return PROGRAM_STATUS_TONES[status as ProgramStatus] ?? NEUTRAL;
}
export function taskStatusTone(status?: string | null): StatusTone {
  return TASK_STATUS_TONES[status as TaskStatus] ?? NEUTRAL;
}
export function taskPriorityTone(priority?: string | null): StatusTone {
  return TASK_PRIORITY_TONES[priority as TaskPriority] ?? NEUTRAL;
}

/** Legacy helper retained for existing call sites. */
export function getStatusColorClass(status: NodeStatus): string {
  return nodeStatusTone(status).className;
}
export function getPriorityBadgeColor(priority: TaskPriority): string {
  return taskPriorityTone(priority).className;
}

/** "IN_PROGRESS" -> "In progress" */
export function humanizeEnum(value?: string | null): string {
  if (!value) return '—';
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

export function getNodeTypeLabel(
  type?: NodeTypeCategory | string | null,
  customName?: string | null,
): string {
  if (type === 'CUSTOM' && customName) return customName;
  if (!type) return customName || 'Node';
  return humanizeEnum(type);
}

export function fullName(
  person?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null,
): string {
  if (!person) return 'Unknown';
  const name = [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
  return name || person.email || 'Unknown';
}

export function initialsOf(
  person?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null,
): string {
  if (!person) return '?';
  const first = person.firstName?.[0] ?? '';
  const last = person.lastName?.[0] ?? '';
  const initials = `${first}${last}`.trim();
  return (initials || person.email?.[0] || '?').toUpperCase();
}

/* ------------------------------------------------------------------ */
/* Schedule maths                                                      */
/* ------------------------------------------------------------------ */

/**
 * Minutes a node is running behind its plan. Prefers the actual timestamp when
 * one has been recorded, otherwise compares the engine's projection.
 */
export function nodeDelayMinutes(node: Pick<
  EventNode,
  'plannedStartTime' | 'projectedStartTime' | 'actualStartTime'
>): number {
  const planned = toDate(node.plannedStartTime);
  const effective = toDate(node.actualStartTime) ?? toDate(node.projectedStartTime);
  if (!planned || !effective) return 0;
  return Math.round((effective.getTime() - planned.getTime()) / 60_000);
}

export function isNodeLive(node: Pick<EventNode, 'status'>): boolean {
  return node.status === 'IN_PROGRESS';
}
