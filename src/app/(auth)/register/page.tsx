import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-tr from-slate-950 via-background to-slate-900">
      <RegisterForm />
    </div>
  );
}
