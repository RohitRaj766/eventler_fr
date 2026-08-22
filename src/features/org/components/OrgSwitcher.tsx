'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchCurrentUser, switchOrganization } from '@/features/auth/authSlice';
import { fetchOrgMetadata } from '@/features/meta/metaSlice';
import { resetPrograms } from '@/features/program/programSlice';
import { resetTasks } from '@/features/task/taskSlice';
import { resetVenues } from '@/features/venue/venueSlice';
import { resetRoles } from '@/features/role/roleSlice';
import { resetOrg } from '@/features/org/orgSlice';
import { resetAudit } from '@/features/audit/auditSlice';
import { resetLiveEngine } from '@/features/liveEngine/liveEngineSlice';
import { resetBilling } from '@/features/billing/billingSlice';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/states';
import { useToast } from '@/hooks/useToast';
import { useCanCreateOrganization } from '@/hooks/useCanCreateOrganization';
import { cn } from '@/lib/utils';

/**
 * Tenant switcher.
 *
 * Switching is a full context change, not a filter: the API issues a new
 * org-scoped access token, and every cached org-scoped collection in the store
 * is dropped so no data from the previous tenant can survive the switch. The
 * user is then sent to the dashboard, because deep links like
 * /programs/:id belong to the org they just left.
 */
export function OrgSwitcher({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const { organizations, activeOrgId, isSwitchingOrg } = useAppSelector((state) => state.auth);
  const activeOrg = organizations.find((org) => org.id === activeOrgId);
  const canCreateOrganization = useCanCreateOrganization();

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === activeOrgId) return;
    setOpen(false);

    const result = await dispatch(switchOrganization(organizationId));
    if (switchOrganization.rejected.match(result)) {
      toast.error('Could not switch organization', result.payload as string);
      return;
    }

    // Clear every tenant-scoped cache before anything can re-render with it.
    dispatch(resetPrograms());
    dispatch(resetTasks());
    dispatch(resetVenues());
    dispatch(resetRoles());
    dispatch(resetOrg());
    dispatch(resetAudit());
    dispatch(resetLiveEngine());
    dispatch(resetBilling());

    // Re-read permissions and org metadata under the new context.
    await Promise.all([dispatch(fetchCurrentUser()), dispatch(fetchOrgMetadata())]);

    toast.success('Organization switched', `You're now working in ${result.payload.activeOrganization.name}.`);
    router.push('/dashboard');
  };

  if (!organizations.length) {
    return (
      <Button variant="outline" size="sm" asChild className={className}>
        <a href="/onboarding">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Create organization
        </a>
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isSwitchingOrg}
          className={cn('max-w-[13rem] justify-between gap-2', className)}
          aria-label={`Active organization: ${activeOrg?.name ?? 'none'}. Change organization`}
        >
          {isSwitchingOrg ? (
            <Spinner />
          ) : (
            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <span className="truncate">{activeOrg?.name ?? 'Select organization'}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Your organizations
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onSelect={() => void handleSwitch(org.id)}
            className="flex items-start gap-2.5 py-2"
          >
            <Check
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                org.id === activeOrgId ? 'text-primary' : 'text-transparent',
              )}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{org.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{org.role}</span>
            </span>
          </DropdownMenuItem>
        ))}

        {/*
          Members belong to an organization; they don't found new ones. Once the
          user is in at least one org this option disappears entirely.
        */}
        {canCreateOrganization && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push('/onboarding')}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create organization
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
