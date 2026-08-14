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
    <Card className="w-full max-w-md bg-white border border-slate-200/80 shadow-xl rounded-2xl p-2">
      <CardHeader className="space-y-2 text-center pb-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
          <Sparkles className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Create Eventler Account</CardTitle>
        <CardDescription className="text-xs text-slate-500 font-medium">
          Register to coordinate events & schedule propagation
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-3 pt-0">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">First Name</label>
              <Input {...register('firstName')} placeholder="Jane" className="h-9 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400" />
              {errors.firstName && <p className="text-xs text-red-500 font-medium">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Last Name</label>
              <Input {...register('lastName')} placeholder="Doe" className="h-9 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400" />
              {errors.lastName && <p className="text-xs text-red-500 font-medium">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <Input {...register('email')} type="email" placeholder="jane@institution.edu" className="h-9 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400" />
            {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Phone Number (Optional)</label>
            <Input {...register('phoneNumber')} placeholder="+1 234 567 890" className="h-9 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <Input {...register('password')} type="password" placeholder="••••••••" className="h-9 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400" />
            {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Confirm Password</label>
            <Input {...register('confirmPassword')} type="password" placeholder="••••••••" className="h-9 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400" />
            {errors.confirmPassword && <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button type="submit" className="w-full h-10 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Register'}
          </Button>
          <p className="text-xs text-center text-slate-500 font-medium">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
