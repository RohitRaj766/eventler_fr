'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/app/hooks';
import { AuthCard } from '@/components/auth/AuthCard';
import { OtpVerificationPanel } from '@/features/verification/components/OtpVerificationPanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/states';
import { MailQuestion } from 'lucide-react';

/**
 * Verification step.
 *
 * The destination is carried in the query string (or read from the signed-in
 * user), so nobody retypes the address they just entered on the previous
 * screen. The phone tab only appears when we actually have a number.
 */
export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const organizations = useAppSelector((state) => state.auth.organizations);

  const email = searchParams.get('email') ?? user?.email ?? '';
  const phone = searchParams.get('phone') ?? user?.phoneNumber ?? '';
  const cameFromRegister = searchParams.get('from') === 'register';

  const [emailVerified, setEmailVerified] = useState(false);
  const [tab, setTab] = useState<'email' | 'phone'>(email ? 'email' : 'phone');

  const nextHref = useMemo(
    () => (organizations.length ? '/dashboard' : '/onboarding'),
    [organizations.length],
  );

  if (!email && !phone) {
    return (
      <AuthCard title="Nothing to verify">
        <EmptyState
          icon={MailQuestion}
          title="We don't know which address to verify"
          description="Sign in first, then start verification from your profile."
          action={
            <Button asChild>
              <Link href="/login">Go to sign in</Link>
            </Button>
          }
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verify your account"
      description={
        cameFromRegister
          ? 'Your account is ready. Confirm your contact details so we can reach you when a schedule changes.'
          : 'Enter the 6-digit code we sent you.'
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.replace(nextHref)}
            className="font-medium text-primary hover:underline"
          >
            {emailVerified ? 'Continue' : 'Skip for now'}
          </button>
          <Link href="/login" className="hover:underline">
            Use a different account
          </Link>
        </div>
      }
    >
      {email && phone ? (
        <Tabs value={tab} onValueChange={(value) => setTab(value as 'email' | 'phone')}>
          <TabsList className="mb-5 grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
          </TabsList>
          <TabsContent value="email">
            <OtpVerificationPanel
              channel="email"
              destination={email}
              onVerified={() => setEmailVerified(true)}
            />
          </TabsContent>
          <TabsContent value="phone">
            <OtpVerificationPanel
              channel="phone"
              destination={phone}
              autoSend={false}
              onVerified={() => undefined}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <OtpVerificationPanel
          channel={email ? 'email' : 'phone'}
          destination={email || phone}
          onVerified={() => setEmailVerified(true)}
        />
      )}
    </AuthCard>
  );
}
