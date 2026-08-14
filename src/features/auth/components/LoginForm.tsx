'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/utils/validationSchemas';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { loginUser, clearAuthError } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Lock, Mail } from 'lucide-react';

export function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    dispatch(clearAuthError());
    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      router.push('/dashboard');
    }
  };

  return (
    <Card className="w-full max-w-md bg-white border border-slate-200/80 shadow-xl rounded-2xl p-2">
      <CardHeader className="space-y-2 text-center pb-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
          <Sparkles className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Sign in to Eventler</CardTitle>
        <CardDescription className="text-xs text-slate-500 font-medium">
          Access live event coordination, node trees & impact engine
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 pt-0">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                {...register('email')}
                type="email"
                placeholder="admin@institution.edu"
                className="pl-9 h-10 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <Link href="#" className="text-xs font-semibold text-indigo-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="pl-9 h-10 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button type="submit" className="w-full h-10 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
          <p className="text-xs text-center text-slate-500 font-medium">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-indigo-600 hover:underline">
              Create account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
