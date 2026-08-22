'use client';

import { forwardRef, useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-10', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

/**
 * Scores a password on length and character variety.
 *
 * The server only enforces a minimum of 8 characters, so this is guidance, not
 * a gate — it never blocks submission, it just tells the user how far past the
 * floor they are.
 */
export function scorePassword(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  hint: string;
} {
  if (!password) return { score: 0, label: '', hint: '' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  const missing: string[] = [];
  if (password.length < 12) missing.push('more characters');
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) missing.push('mixed case');
  if (!/\d/.test(password)) missing.push('a number');
  if (!/[^A-Za-z0-9]/.test(password)) missing.push('a symbol');

  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'] as const;
  const bounded = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;

  return {
    score: bounded,
    label: labels[bounded],
    hint: bounded >= 4 ? '' : missing.length ? `Try adding ${missing.slice(0, 2).join(' and ')}.` : '',
  };
}

const METER_COLORS = [
  'bg-destructive',
  'bg-destructive',
  'bg-amber-500',
  'bg-sky-500',
  'bg-emerald-500',
] as const;

export function PasswordStrength({ password }: { password: string }) {
  const { score, label, hint } = useMemo(() => scorePassword(password), [password]);
  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              index < score ? METER_COLORS[score] : 'bg-muted',
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        <span className="font-medium text-foreground">{label}.</span> {hint}
      </p>
    </div>
  );
}
