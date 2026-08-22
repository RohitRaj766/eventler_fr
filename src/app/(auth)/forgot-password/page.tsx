'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import { authService } from '@/services/api';
import { normalizeApiError } from '@/lib/apiError';
import { AuthCard } from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { InlineError, Spinner } from '@/components/ui/states';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/utils/validationSchemas';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: ForgotPasswordInput) => {
    setError(null);
    try {
      const result = await authService.forgotPassword(email);
      setSentTo(email);
      // No mail transport is configured server-side yet, so the reset token
      // comes back in the response. Surfaced as a dev aid, never hidden.
      setDevToken(result?.resetTokenMock ?? null);
    } catch (caught) {
      setError(normalizeApiError(caught).message);
    }
  };

  if (sentTo) {
    return (
      <AuthCard
        title="Check your email"
        description={`If an account exists for ${sentTo}, we've sent password reset instructions.`}
        footer={
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3.5">
            <MailCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              The reset link expires shortly, so use it soon.
            </p>
          </div>

          {devToken && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              <p className="font-semibold">Development server</p>
              <p className="mt-1">
                No mail transport is configured, so the backend returned the reset token
                directly:
              </p>
              <code className="mt-2 block overflow-x-auto rounded bg-black/5 p-2 font-mono text-[11px] dark:bg-white/10">
                {devToken}
              </code>
            </div>
          )}

          <Button
            className="w-full"
            onClick={() =>
              router.push(`/reset-password${devToken ? `?token=${encodeURIComponent(devToken)}` : ''}`)
            }
          >
            I have a reset token
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send you a link to choose a new one."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <InlineError message={error} />}

        <FormField label="Email" error={errors.email?.message} required>
          {(field) => (
            <Input
              {...field}
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="you@institution.edu"
              autoFocus
            />
          )}
        </FormField>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Sending…' : 'Send reset instructions'}
        </Button>
      </form>
    </AuthCard>
  );
}
