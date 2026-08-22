import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Create account · Eventler',
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Set up Eventler for your institution, or join one you've been invited to."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
