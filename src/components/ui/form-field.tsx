'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  /** Message from Zod or from the server's field errors. */
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  /** Receives the wiring every input needs to be announced correctly. */
  children: (props: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  }) => ReactNode;
}

/**
 * Labels every control, links its hint and error text through
 * `aria-describedby`, and marks invalid inputs — so screen readers hear the
 * same information sighted users read under the field.
 */
export function FormField({
  label,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>

      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy || undefined,
      })}

      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
