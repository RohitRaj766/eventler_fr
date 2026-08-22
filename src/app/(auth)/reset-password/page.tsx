'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { authService } from '@/services/api';
import { normalizeApiError } from '@/lib/apiError';
import { AuthCard } from '@/components/auth/AuthCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { PasswordInput, PasswordStrength } from '@/components/ui/password-input';
import { InlineError, Spinner } from '@/components/ui/states';
import { resetPasswordSchema, type ResetPasswordInput } from '@/utils/validationSchemas';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') ?? '';

  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenRejected, setTokenRejected] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: tokenFromUrl, newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (tokenFromUrl) setValue('token', tokenFromUrl);
  }, [tokenFromUrl, setValue]);

  const newPassword = watch('newPassword');

  const onSubmit = async (values: ResetPasswordInput) => {
    setError(null);
    setTokenRejected(false);
    try {
      await authService.resetPassword(values.token, values.newPassword);
      setDone(true);
    } catch (caught) {
      const normalized = normalizeApiError(caught);
      // An expired or already-used token is the common failure, and the fix is
      // a new email — say so rather than showing the raw message.
      if (/token|expired|invalid/i.test(normalized.message)) {
        setTokenRejected(true);
        setError('This reset link has expired or has already been used.');
      } else {
        setError(normalized.message);
      }
    }
  };

  if (done) {
    return (
      <AuthCard title="Password updated" description="You can now sign in with your new password.">
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              For safety, other sessions may need to sign in again.
            </p>
          </div>
          <Button className="w-full" onClick={() => router.replace('/login')}>
            Continue to sign in
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      description="Paste the token from your reset email, then pick a new password."
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <InlineError message={error} />}

        {tokenRejected && (
          <Button asChild variant="outline" className="w-full">
            <Link href="/forgot-password">Request a new reset link</Link>
          </Button>
        )}

        <FormField
          label="Reset token"
          error={errors.token?.message}
          required
          hint={tokenFromUrl ? 'Filled in from your reset link.' : undefined}
        >
          {(field) => (
            <Input
              {...field}
              {...register('token')}
              placeholder="Paste your reset token"
              autoComplete="off"
              className="font-mono text-xs"
            />
          )}
        </FormField>

        <FormField label="New password" error={errors.newPassword?.message} required>
          {(field) => (
            <PasswordInput
              {...field}
              {...register('newPassword')}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          )}
        </FormField>
        <PasswordStrength password={newPassword ?? ''} />

        <FormField label="Confirm new password" error={errors.confirmPassword?.message} required>
          {(field) => (
            <PasswordInput {...field} {...register('confirmPassword')} autoComplete="new-password" />
          )}
        </FormField>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthCard>
  );
}
