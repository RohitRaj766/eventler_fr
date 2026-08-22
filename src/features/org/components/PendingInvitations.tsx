'use client';

import { useState } from 'react';
import { MailX, Send, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { revokeInvitation } from '@/features/org/orgSlice';
import { Button } from '@/components/ui/button';
import { EmptyState, SkeletonText } from '@/components/ui/states';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/useToast';
import { useNow } from '@/hooks/useNow';
import { formatDateOnly, formatRelativeTime, fullName } from '@/utils/formatters';
import type { InvitationStatus, OrganizationInvitation } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_TONES: Record<InvitationStatus, string> = {
  PENDING: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-700',
  ACCEPTED: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700',
  REVOKED: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-600',
  EXPIRED: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700',
};

const STATUS_LABELS: Record<InvitationStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Joined',
  REVOKED: 'Revoked',
  EXPIRED: 'Expired',
};

/**
 * Outstanding invitations.
 *
 * Only PENDING and EXPIRED rows are worth an admin's attention — ACCEPTED
 * people are already visible in the roster above, and revoked ones are noise —
 * so the list is filtered down to what still needs action.
 */
export function PendingInvitations({
  invitations,
  isLoading,
  onInvite,
}: {
  invitations: OrganizationInvitation[];
  isLoading: boolean;
  onInvite: () => void;
}) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const isMutating = useAppSelector((state) => state.org.isMutating);
  const [pendingRevoke, setPendingRevoke] = useState<OrganizationInvitation | null>(null);

  // Read the clock outside render so the expiry check stays pure and the
  // "expires in…" copy refreshes on its own.
  const now = useNow();
  const outstanding = invitations
    .filter((invitation) => invitation.status === 'PENDING' || invitation.status === 'EXPIRED')
    .map((invitation) => ({
      ...invitation,
      // The backend leaves rows PENDING past their expiry, so derive it here.
      status:
        invitation.status === 'PENDING' &&
        now > 0 &&
        new Date(invitation.expiresAt).getTime() < now
          ? ('EXPIRED' as InvitationStatus)
          : invitation.status,
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleRevoke = async (invitation: OrganizationInvitation) => {
    const result = await dispatch(revokeInvitation(invitation.id));
    if (revokeInvitation.rejected.match(result)) {
      toast.error('Could not revoke the invitation', result.payload as string);
      return;
    }
    toast.success('Invitation revoked', `${invitation.email} can no longer use it.`);
  };

  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Outstanding invitations</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            People invited by email who haven&apos;t joined yet.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onInvite}>
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          Invite
        </Button>
      </header>

      {isLoading && !invitations.length ? (
        <SkeletonText lines={3} className="p-5" />
      ) : outstanding.length === 0 ? (
        <EmptyState
          icon={MailX}
          title="Nothing outstanding"
          description="Everyone you've invited has either joined or been revoked."
          className="border-0 bg-transparent py-8"
        />
      ) : (
        <ul className="divide-y divide-border">
          {outstanding.map((invitation) => (
            <li
              key={invitation.id}
              className="flex flex-wrap items-center gap-3 px-5 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {invitation.email}
                  </p>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-xs font-medium',
                      STATUS_TONES[invitation.status],
                    )}
                  >
                    {STATUS_LABELS[invitation.status]}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {invitation.role?.name ?? 'Member'}
                  {invitation.invitedBy && ` · invited by ${fullName(invitation.invitedBy)}`}
                  {invitation.status === 'EXPIRED'
                    ? ` · expired ${formatDateOnly(invitation.expiresAt)}`
                    : ` · expires ${formatRelativeTime(invitation.expiresAt)}`}
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setPendingRevoke(invitation)}
                disabled={isMutating}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pendingRevoke)}
        onOpenChange={(open) => !open && setPendingRevoke(null)}
        title="Revoke this invitation?"
        description={
          pendingRevoke ? (
            <>
              The invitation for{' '}
              <strong className="text-foreground">{pendingRevoke.email}</strong> will stop working.
              You can always invite them again later.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Revoke invitation"
        onConfirm={async () => {
          if (pendingRevoke) await handleRevoke(pendingRevoke);
          setPendingRevoke(null);
        }}
      />
    </section>
  );
}
