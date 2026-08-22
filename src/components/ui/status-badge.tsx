'use client';

import {
  nodeStatusTone,
  programStatusTone,
  taskPriorityTone,
  taskStatusTone,
  type StatusTone,
} from '@/utils/formatters';
import { cn } from '@/lib/utils';

type Domain = 'node' | 'program' | 'task' | 'priority';

const TONE_LOOKUP: Record<Domain, (value?: string | null) => StatusTone> = {
  node: nodeStatusTone,
  program: programStatusTone,
  task: taskStatusTone,
  priority: taskPriorityTone,
};

interface StatusBadgeProps {
  value?: string | null;
  domain?: Domain;
  /** Adds a live-pulsing ring — reserved for genuinely in-flight states. */
  pulse?: boolean;
  className?: string;
}

/**
 * The single badge used for every status in the app.
 *
 * Colour is never the only signal: each badge also carries its own text label
 * and a shaped dot, so the state survives greyscale printing and colour-vision
 * differences.
 */
export function StatusBadge({ value, domain = 'node', pulse, className }: StatusBadgeProps) {
  const tone = TONE_LOOKUP[domain](value);
  const isActive = value === 'IN_PROGRESS' || value === 'LIVE';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        tone.className,
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full',
          tone.dot,
          (pulse ?? isActive) && 'animate-live-pulse',
        )}
        aria-hidden="true"
      />
      {tone.label}
    </span>
  );
}

/** Compact variant for dense rows where the label would not fit. */
export function StatusDot({
  value,
  domain = 'node',
  className,
}: {
  value?: string | null;
  domain?: Domain;
  className?: string;
}) {
  const tone = TONE_LOOKUP[domain](value);
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', tone.dot, className)}
      role="img"
      aria-label={tone.label}
      title={tone.label}
    />
  );
}
