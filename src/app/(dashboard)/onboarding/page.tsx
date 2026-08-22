'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Sparkles, Users } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { createOrganization } from '@/features/org/orgSlice';
import { fetchCurrentUser, organizationJoined } from '@/features/auth/authSlice';
import { fetchOrgMetadata } from '@/features/meta/metaSlice';
import { CreateOrgModal } from '@/features/org/components/CreateOrgModal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useCanCreateOrganization } from '@/hooks/useCanCreateOrganization';
import { LoadingState } from '@/components/ui/states';
import type { CreateOrgInput } from '@/utils/validationSchemas';

/**
 * First-run screen for a user who belongs to no organization.
 *
 * This is the only place an organization can be created, and it is reachable
 * only while the user has none. Anyone who already belongs to one is a member
 * of that institution — they work inside it rather than founding another — so
 * they are sent back to the dashboard.
 */
export default function OnboardingPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  const user = useAppSelector((state) => state.auth.user);
  const canCreateOrganization = useCanCreateOrganization();

  // Guards the route itself, not just the button: a member who types the URL
  // (or follows a stale link) lands back on their dashboard.
  useEffect(() => {
    if (!canCreateOrganization) router.replace('/dashboard');
  }, [canCreateOrganization, router]);

  const handleCreate = async (values: CreateOrgInput) => {
    const result = await dispatch(
      createOrganization({
        name: values.name,
        code: values.code.toLowerCase(),
        logoUrl: values.logoUrl || undefined,
      }),
    );

    if (createOrganization.rejected.match(result)) {
      toast.error('Could not create the organization', result.payload as string);
      return;
    }

    // Adopt it locally so the switcher is populated before /auth/me returns.
    dispatch(
      organizationJoined({
        id: result.payload.id,
        name: result.payload.name,
        code: result.payload.code,
        role: 'Organization Super Admin',
      }),
    );
    await Promise.all([dispatch(fetchCurrentUser()), dispatch(fetchOrgMetadata())]);

    setModalOpen(false);
    toast.success('Organization created', `${result.payload.name} is ready.`);
    router.replace('/dashboard');
  };

  if (!canCreateOrganization) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState label="Taking you to your dashboard…" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center py-10">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Sparkles className="h-5 w-5" aria-hidden="true" />
      </div>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
        Welcome to Eventler{user?.firstName ? `, ${user.firstName}` : ''}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Eventler works inside an organization — your institution, department or event committee.
        You aren&apos;t part of one yet.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-sm font-semibold text-foreground">Set one up</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Only do this if you&apos;re establishing your institution on Eventler. You become its
            Super Admin, and everyone else joins with the code it generates.
          </p>
          <Button className="mt-4 w-full" onClick={() => setModalOpen(true)}>
            Create organization
          </Button>
        </div>

        <div className="rounded-xl border border-dashed border-border bg-card/50 p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Users className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-sm font-semibold text-foreground">
            Joining one? This is the usual route
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            If your institution is already on Eventler, don&apos;t create a second one. Ask an
            admin to invite you by email, or to send you the institution code — either way it
            appears in your organization switcher, and this screen won&apos;t show again.
          </p>
        </div>
      </div>

      <CreateOrgModal open={modalOpen} onOpenChange={setModalOpen} onSubmit={handleCreate} />
    </div>
  );
}
