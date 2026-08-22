'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Mail, RefreshCw, Smartphone } from 'lucide-react';
import { verificationService } from '@/services/api';
import { normalizeApiError } from '@/lib/apiError';
import { Button } from '@/components/ui/button';
import { OtpInput } from '@/components/ui/otp-input';
import { InlineError, Spinner } from '@/components/ui/states';
import { useCountdown } from '@/hooks/useCountdown';
import { useToast } from '@/hooks/useToast';

const RESEND_COOLDOWN_SECONDS = 45;

type Channel = 'email' | 'phone';

interface OtpVerificationPanelProps {
  channel: Channel;
  /** Email address or phone number — never re-typed by the user. */
  destination: string;
  onVerified: () => void;
  /** Sends a code as soon as the panel mounts. */
  autoSend?: boolean;
}

const COPY: Record<Channel, { icon: typeof Mail; noun: string; sendLabel: string }> = {
  email: { icon: Mail, noun: 'email address', sendLabel: 'Send code to email' },
  phone: { icon: Smartphone, noun: 'phone number', sendLabel: 'Send code by SMS' },
};

/**
 * OTP entry for either channel.
 *
 * The backend currently returns the generated code as `otpMock` in the send
 * response because no mail or SMS transport is configured. When that field is
 * present we surface it explicitly as a development aid rather than silently
 * relying on a code the user will never receive.
 */
export function OtpVerificationPanel({
  channel,
  destination,
  onVerified,
  autoSend = true,
}: OtpVerificationPanelProps) {
  const toast = useToast();
  const { icon: Icon, noun, sendLabel } = COPY[channel];

  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [hasSentOnce, setHasSentOnce] = useState(false);
  const [verified, setVerified] = useState(false);
  const cooldown = useCountdown();

  const send = async (silent = false) => {
    setIsSending(true);
    setError(null);
    try {
      const result =
        channel === 'email'
          ? await verificationService.sendEmailOtp(destination)
          : await verificationService.sendPhoneOtp(destination);

      setHasSentOnce(true);
      cooldown.start(RESEND_COOLDOWN_SECONDS);
      setDevCode(result?.otpMock ?? null);
      if (!silent) toast.success('Code sent', `We sent a 6-digit code to ${destination}.`);
    } catch (caught) {
      const normalized = normalizeApiError(caught);
      // Phone OTP 500s today — the SMS provider isn't wired up server-side.
      const message =
        channel === 'phone' && normalized.status >= 500
          ? 'SMS delivery is not available yet on this server. You can verify your email instead and add your phone later.'
          : normalized.message;
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  // Sends exactly once per destination. The guard ref keeps React's dev-mode
  // double-invoke of effects from firing two OTP requests (and burning the
  // backend's 10-per-15-minutes auth rate limit).
  const autoSentFor = useRef<string | null>(null);
  useEffect(() => {
    if (!autoSend) return;
    if (autoSentFor.current === destination) return;
    autoSentFor.current = destination;
    void send(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend, destination]);

  const verify = async (value: string) => {
    if (value.length !== 6) return;
    setIsVerifying(true);
    setError(null);
    try {
      if (channel === 'email') await verificationService.verifyEmailOtp(destination, value);
      else await verificationService.verifyPhoneOtp(destination, value);

      setVerified(true);
      toast.success(`${channel === 'email' ? 'Email' : 'Phone number'} verified`);
      onVerified();
    } catch (caught) {
      const normalized = normalizeApiError(caught);
      // The API returns one message for both wrong and expired codes, so the
      // copy has to cover both without guessing which happened.
      setError(
        /expired|invalid/i.test(normalized.message)
          ? 'That code is incorrect or has expired. Request a new one and try again.'
          : normalized.message,
      );
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  if (verified) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="h-9 w-9 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <p className="text-sm font-semibold text-foreground">Your {noun} is verified</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 text-sm">
          <p className="text-muted-foreground">
            {hasSentOnce ? 'We sent a 6-digit code to' : 'We’ll send a 6-digit code to'}
          </p>
          <p className="truncate font-medium text-foreground">{destination}</p>
        </div>
      </div>

      {devCode && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          <span className="font-semibold">Development server:</span> no mail transport is
          configured, so the backend returned the code directly —{' '}
          <span className="font-mono font-semibold tracking-widest">{devCode}</span>
        </p>
      )}

      {error && <InlineError message={error} />}

      <OtpInput
        value={code}
        onChange={setCode}
        onComplete={verify}
        disabled={isVerifying || !hasSentOnce}
        invalid={Boolean(error)}
        autoFocus={hasSentOnce}
        label={`Verification code sent to your ${noun}`}
      />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={() => verify(code)}
          disabled={code.length !== 6 || isVerifying}
          className="w-full"
        >
          {isVerifying && <Spinner />}
          {isVerifying ? 'Verifying…' : 'Verify'}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => void send()}
          disabled={isSending || cooldown.isRunning}
          className="w-full"
        >
          {isSending ? <Spinner /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
          {cooldown.isRunning
            ? `Resend in ${cooldown.remaining}s`
            : hasSentOnce
              ? 'Resend code'
              : sendLabel}
        </Button>
      </div>
    </div>
  );
}
