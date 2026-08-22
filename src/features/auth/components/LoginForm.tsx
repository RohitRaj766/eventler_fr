'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearAuthError, loginUser } from '@/features/auth/authSlice';
import { loginSchema, type LoginInput } from '@/utils/validationSchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { PasswordInput } from '@/components/ui/password-input';
import { InlineError, Spinner } from '@/components/ui/states';
import { useEffect } from 'react';

export function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSubmitting, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // A stale error from a previous visit shouldn't greet the next one.
  useEffect(() => () => void dispatch(clearAuthError()), [dispatch]);

  const onSubmit = async (values: LoginInput) => {
    const result = await dispatch(loginUser(values));
    if (loginUser.rejected.match(result)) {
      // Anchor credential failures on the password field without revealing
      // which half was wrong.
      const message = (result.payload as string) ?? '';
      if (/password|credential|invalid/i.test(message)) {
        setError('password', { message: 'Email or password is incorrect' });
      }
      return;
    }
    const next = searchParams.get('next');
    router.replace(next && next.startsWith('/') ? next : '/dashboard');
  };

  return (
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

      <FormField label="Password" error={errors.password?.message} required>
        {(field) => (
          <PasswordInput
            {...field}
            {...register('password')}
            autoComplete="current-password"
            placeholder="Your password"
          />
        )}
      </FormField>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      {/* Disabled while in flight so a double click cannot submit twice. */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner />}
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
