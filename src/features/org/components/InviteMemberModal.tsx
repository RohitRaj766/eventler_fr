'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Copy, Info, UserPlus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchOrgMembers, inviteMember } from '@/features/org/orgSlice';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InlineError, Spinner } from '@/components/ui/states';
import { useToast } from '@/hooks/useToast';
import type { InvitationResult } from '@/types';

const inviteSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  roleId: z.string().min(1, 'Choose a role'),
});

type InviteInput = z.infer<typeof inviteSchema>;

/**
 * Invites someone to the organization.
 *
 * The backend behaves in two quite different ways depending on whether the
 * email already has an Eventler account, and the difference matters a lot to
 * the admin — so the result screen says which one happened rather than showing
 * one generic "invited!" message:
 *
 *  - existing account -> they are on the roster right now, nothing else to do;
 *  - new email        -> a PENDING invitation is recorded, but no accept
 *                        endpoint is deployed yet, so the person still has to
 *                        register with the organization code. We show them the
 *                        code so the admin can pass it on.
 */
export function InviteMemberModal({
  open,
  onOpenChange,
  organizationCode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationCode?: string;
}) {
  const dispatch = useAppDispatch();
  const toast = useToast();

  const orgRoles = useAppSelector((state) => state.meta.orgRoles);
  const isMutating = useAppSelector((state) => state.org.isMutating);

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InvitationResult | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', roleId: '' },
  });

  const roleId = watch('roleId');

  useEffect(() => {
    if (!open) return;
    setError(null);
    setResult(null);
    // Default to the baseline Member role when one exists.
    const fallback = orgRoles.find((role) => /member/i.test(role.name)) ?? orgRoles[0];
    reset({ email: '', roleId: fallback?.id ?? '' });
  }, [open, orgRoles, reset]);

  const onSubmit = async (values: InviteInput) => {
    setError(null);
    const action = await dispatch(inviteMember({ email: values.email, roleId: values.roleId }));

    if (inviteMember.rejected.match(action)) {
      setError(action.payload as string);
      return;
    }

    setResult(action.payload);
    if (action.payload.isExistingUser) {
      // They joined immediately, so the roster is already stale.
      void dispatch(fetchOrgMembers());
      toast.success('Member added', `${values.email} now has access.`);
    } else {
      toast.success('Invitation recorded', `We saved an invitation for ${values.email}.`);
    }
  };

  const copyCode = async () => {
    if (!organizationCode) return;
    try {
      await navigator.clipboard.writeText(organizationCode);
      toast.success('Code copied');
    } catch {
      toast.error('Could not copy', 'Select the code and copy it manually.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isMutating && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite someone</DialogTitle>
          <DialogDescription>
            You never set anyone&apos;s password — people always choose their own.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3.5">
              <CheckCircle2
                className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <div className="min-w-0 text-sm">
                {result.isExistingUser ? (
                  <>
                    <p className="font-semibold text-foreground">They already had an account</p>
                    <p className="mt-1 text-muted-foreground">
                      <span className="font-medium text-foreground">{result.invitation.email}</span>{' '}
                      has been added to your organization as{' '}
                      <span className="font-medium text-foreground">
                        {result.invitation.role?.name}
                      </span>
                      . They&apos;ll see it in their organization switcher next time they sign in —
                      nothing else needed.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-foreground">Invitation saved</p>
                    <p className="mt-1 text-muted-foreground">
                      No account exists for{' '}
                      <span className="font-medium text-foreground">{result.invitation.email}</span>{' '}
                      yet, so we recorded a pending invitation.
                    </p>
                  </>
                )}
              </div>
            </div>

            {!result.isExistingUser && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-sm dark:border-amber-700 dark:bg-amber-950/40">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  They still need your organization code to sign up
                </p>
                <p className="mt-1 leading-relaxed text-amber-900 dark:text-amber-200">
                  This server has no endpoint for accepting an invitation link yet, so the pending
                  invitation on its own won&apos;t let them in. Ask them to register at{' '}
                  <span className="font-medium">/register</span> with this code — they choose their
                  own password there:
                </p>

                {organizationCode && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <code className="flex-1 truncate rounded bg-black/5 px-2 py-1.5 font-mono text-sm font-semibold text-amber-900 dark:bg-white/10 dark:text-amber-100">
                      {organizationCode}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyCode}>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      Copy
                    </Button>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setResult(null)}>
                Invite someone else
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {error && <InlineError message={error} />}

            <FormField label="Email address" error={errors.email?.message} required>
              {(field) => (
                <Input
                  {...field}
                  {...register('email')}
                  type="email"
                  placeholder="colleague@institution.edu"
                  autoFocus
                />
              )}
            </FormField>

            <FormField
              label="Role"
              error={errors.roleId?.message}
              required
              hint="What they'll be able to do once they're in."
            >
              {(field) => (
                <Select
                  value={roleId}
                  onValueChange={(value) => setValue('roleId', value, { shouldValidate: true })}
                  disabled={!orgRoles.length}
                >
                  <SelectTrigger id={field.id}>
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                If this person already has an Eventler account they join immediately. If not,
                we&apos;ll record the invitation and show you the code they need to sign up with.
              </span>
            </p>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isMutating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating || !orgRoles.length}>
                {isMutating ? <Spinner /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
                {isMutating ? 'Inviting…' : 'Send invitation'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
