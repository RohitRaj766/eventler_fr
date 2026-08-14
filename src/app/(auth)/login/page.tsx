import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-tr from-slate-950 via-background to-slate-900">
      <LoginForm />
    </div>
  );
}
