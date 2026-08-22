'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '@/services/api';
import { normalizeApiError } from '@/lib/apiError';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { PasswordInput, PasswordStrength } from '@/components/ui/password-input';
import { InlineError, Spinner } from '@/components/ui/states';
import { useToast } from '@/hooks/useToast';
import { changePasswordSchema, type ChangePasswordInput } from '@/utils/validationSchemas';

export default function ChangePasswordPage() {
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword');

  const onSubmit = async (values: ChangePasswordInput) => {
    setError(null);
    try {
      await authService.changePassword(values.currentPassword, values.newPassword);
      reset();
      toast.success('Password changed', 'Use your new password the next time you sign in.');
    } catch (caught) {
      const normalized = normalizeApiError(caught);
      // The one failure the user can act on is a wrong current password.
      if (/current password/i.test(normalized.message)) {
        setFieldError('currentPassword', { message: 'That password is incorrect' });
      } else {
        setError(normalized.message);
      }
    }
  };

  return (
    <div className="max-w-lg space-y-5">
      <PageHeader
        title="Change password"
        description="Choose a new password for your Eventler account."
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-xl border border-border bg-card p-5"
        noValidate
      >
        {error && <InlineError message={error} />}

        <FormField label="Current password" error={errors.currentPassword?.message} required>
          {(field) => (
            <PasswordInput
              {...field}
              {...register('currentPassword')}
              autoComplete="current-password"
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
            <PasswordInput
              {...field}
              {...register('confirmPassword')}
              autoComplete="new-password"
            />
          )}
        </FormField>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Updating…' : 'Change password'}
        </Button>
      </form>
    </div>
  );
}
