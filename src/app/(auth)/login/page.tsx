import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in · Eventler',
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Sign in"
      description="Welcome back. Pick up where your event left off."
      footer={
        <>
          New to Eventler?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
