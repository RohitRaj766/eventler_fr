'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@/utils/validationSchemas';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { registerUser, clearAuthError } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function RegisterForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    dispatch(clearAuthError());
    const result = await dispatch(registerUser(data));
    if (registerUser.fulfilled.match(result)) {
      router.push('/login');
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-border/40 backdrop-blur">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
          <Sparkles className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Create Eventler Account</CardTitle>
        <CardDescription>
          Register to coordinate events & schedule propagation
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-3">
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-xs font-medium text-red-500 border border-red-500/20">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">First Name</label>
              <Input {...register('firstName')} placeholder="Jane" />
              {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Last Name</label>
              <Input {...register('lastName')} placeholder="Doe" />
              {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Email Address</label>
            <Input {...register('email')} type="email" placeholder="jane@institution.edu" />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Phone Number (Optional)</label>
            <Input {...register('phoneNumber')} placeholder="+1 234 567 890" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Password</label>
            <Input {...register('password')} type="password" placeholder="••••••••" />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Confirm Password</label>
            <Input {...register('confirmPassword')} type="password" placeholder="••••••••" />
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Register'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
