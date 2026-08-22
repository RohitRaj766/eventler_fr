'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fired once all `length` digits are present. */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  label?: string;
  autoFocus?: boolean;
}

/**
 * Six separate boxes that behave like one field.
 *
 * The details that make or break an OTP box are all here: typing advances,
 * Backspace on an empty box steps back and clears the previous one, arrows
 * move the caret, and pasting a full code from a mail client fills every box
 * at once instead of dropping five characters. The whole group is one tab
 * stop, and screen readers hear a single labelled input.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  invalid,
  label = 'Verification code',
  autoFocus,
}: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  useEffect(() => {
    if (autoFocus) inputs.current[0]?.focus();
  }, [autoFocus]);

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const setDigit = (index: number, digit: string) => {
    const chars = value.padEnd(length, ' ').split('');
    chars[index] = digit || ' ';
    commit(chars.join('').replace(/\s/g, ''));
  };

  const handleChange = (index: number, raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '');
    if (!digitsOnly) {
      setDigit(index, '');
      return;
    }

    // Typing (or autofill) can deliver several digits into one box.
    if (digitsOnly.length > 1) {
      const chars = value.padEnd(length, ' ').split('');
      digitsOnly.split('').forEach((digit, offset) => {
        if (index + offset < length) chars[index + offset] = digit;
      });
      commit(chars.join('').replace(/\s/g, ''));
      const nextIndex = Math.min(index + digitsOnly.length, length - 1);
      inputs.current[nextIndex]?.focus();
      return;
    }

    setDigit(index, digitsOnly);
    if (index < length - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (digits[index].trim()) {
        setDigit(index, '');
      } else if (index > 0) {
        setDigit(index - 1, '');
        inputs.current[index - 1]?.focus();
      }
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      inputs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    commit(pasted);
    inputs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center justify-between gap-2 sm:gap-3"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          // Lets the browser/OS offer the code straight from the SMS or email.
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={digit.trim()}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => {
            setFocusedIndex(index);
            event.target.select();
          }}
          className={cn(
            'h-13 w-full min-w-0 rounded-lg border bg-transparent text-center text-xl font-semibold tabular-nums text-foreground transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-50',
            invalid ? 'border-destructive' : 'border-input focus:border-ring',
            focusedIndex === index && !invalid && 'border-ring',
          )}
          style={{ height: '3.25rem' }}
        />
      ))}
    </div>
  );
}
