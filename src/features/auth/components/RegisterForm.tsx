'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@/utils/validationSchemas';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { registerUser, clearAuthError } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Building, UserCheck } from 'lucide-react';

export function RegisterForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [registerMode, setRegisterMode] = useState<'JOIN_ORG' | 'CREATE_ORG'>('JOIN_ORG');

  const codeParam = searchParams.get('code') || searchParams.get('orgCode') || searchParams.get('organizationCode') || '';
  const emailParam = searchParams.get('email') || '';
  const programIdParam = searchParams.get('programId') || '';
  const roleIdParam = searchParams.get('roleId') || '';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      mode: 'JOIN_ORG',
      organizationCode: codeParam,
      email: emailParam,
      programId: programIdParam,
      roleId: roleIdParam,
    },
  });

  const handleModeChange = (mode: 'JOIN_ORG' | 'CREATE_ORG') => {
    setRegisterMode(mode);
    setValue('mode', mode);
  };

  const onSubmit = async (data: RegisterInput) => {
    dispatch(clearAuthError());
    const result = await dispatch(registerUser(data));
    if (registerUser.fulfilled.match(result)) {
      router.push('/login');
    }
  };

  return (
    <Card className="w-full max-w-md bg-white border border-slate-200/80 shadow-xl rounded-2xl p-2">
      <CardHeader className="space-y-2 text-center pb-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
          <Sparkles className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Join Eventler</CardTitle>
        <CardDescription className="text-xs text-slate-500 font-medium">
          Institutional event coordination & schedule propagation
        </CardDescription>

        {/* High-Contrast Registration Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mt-3">
          <button
            type="button"
            onClick={() => handleModeChange('JOIN_ORG')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
              registerMode === 'JOIN_ORG'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span>Join Institution</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('CREATE_ORG')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-bold rounded-lg transition-all ${
              registerMode === 'CREATE_ORG'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building className="h-3.5 w-3.5 text-indigo-600" />
            <span>Register New Univ</span>
          </button>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register('mode')} value={registerMode} />
        <input type="hidden" {...register('programId')} />
        <input type="hidden" {...register('roleId')} />

        <CardContent className="space-y-3 pt-0">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
              {error}
            </div>
          )}

          {/* Conditional Institution Name for Super Admin Setup */}
          {registerMode === 'CREATE_ORG' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Institution Name</label>
              <Input
                {...register('organizationName')}
                placeholder="e.g. Arka Jain University"
                className="h-9 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
              {errors.organizationName && (
                <p className="text-xs text-red-500 font-medium">{errors.organizationName.message}</p>
              )}
            </div>
          )}

          {/* Unique Organization Code */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              {registerMode === 'CREATE_ORG' ? 'Set Unique Institution Code' : 'Institution Unique Code'}
            </label>
            <Input
              {...register('organizationCode')}
              placeholder="e.g. AJU-2026"
              className="h-9 text-xs font-mono font-bold bg-white border-slate-200 text-slate-900 uppercase placeholder:text-slate-400"
            />
            {errors.organizationCode && (
              <p className="text-xs text-red-500 font-medium">{errors.organizationCode.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">First Name</label>
              <Input
                {...register('firstName')}
                placeholder="Alex"
                className="h-9 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
              {errors.firstName && <p className="text-xs text-red-500 font-medium">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Last Name</label>
              <Input
                {...register('lastName')}
                placeholder="Rivera"
                className="h-9 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
              />
              {errors.lastName && <p className="text-xs text-red-500 font-medium">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <Input
              {...register('email')}
              type="email"
              placeholder="user@institution.edu"
              className="h-9 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
            />
            {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <Input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="h-9 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
            />
            {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Confirm Password</label>
            <Input
              {...register('confirmPassword')}
              type="password"
              placeholder="••••••••"
              className="h-9 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            className="w-full h-10 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
            disabled={isLoading}
          >
            {isLoading
              ? 'Processing...'
              : registerMode === 'CREATE_ORG'
              ? 'Register Institution & Create Account'
              : 'Join Institution & Create Account'}
          </Button>
          <p className="text-xs text-center text-slate-500 font-medium">
            Already registered?{' '}
            <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
