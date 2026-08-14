import { Suspense } from 'react';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <Suspense fallback={<div className="text-slate-500 text-xs">Loading registration form...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
