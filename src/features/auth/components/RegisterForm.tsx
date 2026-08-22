'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearAuthError, registerUser } from '@/features/auth/authSlice';
import { registerSchema, type RegisterInput } from '@/utils/validationSchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { PasswordInput, PasswordStrength } from '@/components/ui/password-input';
import { InlineError, Spinner } from '@/components/ui/states';
import { normalizeApiError } from '@/lib/apiError';

/**
 * Sign-up.
 *
 * The backend logs the new user straight in and returns a token pair, so there
 * is no second sign-in step. `orgCode` is optional: with one the user joins an
 * existing institution as a Member, without one they continue to onboarding to
 * create their own organization.
 */
export function RegisterForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isSubmitting, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      orgCode: '',
    },
  });

  const password = watch('password');
  const email = watch('email');

  useEffect(() => () => void dispatch(clearAuthError()), [dispatch]);

  const onSubmit = async (values: RegisterInput) => {
    const result = await dispatch(
      registerUser({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber || undefined,
        orgCode: values.orgCode || undefined,
      }),
    );

    if (registerUser.rejected.match(result)) {
      const message = (result.payload as string) ?? '';
      // Map the two failures a user can actually fix onto their fields.
      if (/email.*(exists|registered|taken)/i.test(message)) {
        setError('email', { message: 'An account with this email already exists' });
      } else if (/org.?code|organization.*(not found|invalid)/i.test(message)) {
        setError('orgCode', { message: 'No institution found with that code' });
      }
      return;
    }

    // Verify the address next; the flow carries the email so it isn't retyped.
    router.replace(`/verify?email=${encodeURIComponent(values.email)}&from=register`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {error && <InlineError message={normalizeApiError(error).message} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="First name" error={errors.firstName?.message} required>
          {(field) => (
            <Input {...field} {...register('firstName')} autoComplete="given-name" autoFocus />
          )}
        </FormField>
        <FormField label="Last name" error={errors.lastName?.message} required>
          {(field) => <Input {...field} {...register('lastName')} autoComplete="family-name" />}
        </FormField>
      </div>

      <FormField label="Email" error={errors.email?.message} required>
        {(field) => (
          <Input
            {...field}
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@institution.edu"
          />
        )}
      </FormField>

      <FormField
        label="Phone number"
        error={errors.phoneNumber?.message}
        hint="Optional. Used for SMS alerts when an event you own runs late."
      >
        {(field) => (
          <Input
            {...field}
            {...register('phoneNumber')}
            type="tel"
            autoComplete="tel"
            placeholder="+14155550123"
          />
        )}
      </FormField>

      <FormField label="Password" error={errors.password?.message} required>
        {(field) => (
          <PasswordInput
            {...field}
            {...register('password')}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        )}
      </FormField>
      <PasswordStrength password={password ?? ''} />

      <FormField label="Confirm password" error={errors.confirmPassword?.message} required>
        {(field) => (
          <PasswordInput
            {...field}
            {...register('confirmPassword')}
            autoComplete="new-password"
          />
        )}
      </FormField>

      <FormField
        label="Institution code"
        error={errors.orgCode?.message}
        hint="Optional. Enter the code your institution gave you to join it — or leave it blank to create your own."
      >
        {(field) => (
          <Input {...field} {...register('orgCode')} placeholder="e.g. arkajain" autoCapitalize="none" />
        )}
      </FormField>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner />}
        {isSubmitting ? 'Creating your account…' : 'Create account'}
      </Button>

      <p className="text-xs text-muted-foreground">
        We&apos;ll send a 6-digit code to {email || 'your email'} to confirm it&apos;s yours.
      </p>
    </form>
  );
}
