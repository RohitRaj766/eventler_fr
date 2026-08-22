'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { updateProgramStatus } from '@/features/program/programSlice';
import { selectProgramStatusOptions } from '@/features/meta/metaSlice';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/states';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermission';
import type { ProgramStatus } from '@/types';

/**
 * Lifecycle transitions the backend accepts.
 *
 * Mirrored here so the UI only offers moves that will succeed — the server
 * still validates and remains the authority, and it rejects anything else with
 * "Invalid program status transition from X to Y".
 */
const ALLOWED_TRANSITIONS: Record<ProgramStatus, ProgramStatus[]> = {
  DRAFT: ['PLANNED', 'CANCELLED'],
  PLANNED: ['PUBLISHED', 'DRAFT', 'CANCELLED'],
  PUBLISHED: ['LIVE', 'PLANNED', 'CANCELLED'],
  LIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
  PAUSED: ['LIVE', 'COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

/** Transitions worth a second look before they fire. */
const NEEDS_CONFIRMATION: Partial<Record<ProgramStatus, string>> = {
  LIVE: 'Going live starts the run-of-show. Coordinators will begin recording actual times against this schedule.',
  COMPLETED: 'Completing a program is final — it cannot be reopened afterwards.',
  CANCELLED: 'Cancelling a program is final — it cannot be reopened afterwards.',
};

export function ProgramStatusControl({
  programId,
  status,
}: {
  programId: string;
  status: ProgramStatus;
}) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { can } = usePermissions();
  const isUpdating = useAppSelector((state) => state.program.isUpdatingStatus);
  const statusOptions = useAppSelector(selectProgramStatusOptions);
  const [pending, setPending] = useState<ProgramStatus | null>(null);

  const canUpdate = can('program.update');

  const nextStatuses = useMemo(() => {
    const allowed = new Set(ALLOWED_TRANSITIONS[status] ?? []);
    return statusOptions.filter((option) => allowed.has(option.value));
  }, [status, statusOptions]);

  const apply = async (next: ProgramStatus) => {
    const result = await dispatch(updateProgramStatus({ programId, status: next }));
    if (updateProgramStatus.rejected.match(result)) {
      toast.error('Could not update status', result.payload as string);
      return;
    }
    toast.success(`Program is now ${next.toLowerCase()}`);
  };

  const handleSelect = (next: ProgramStatus) => {
    if (NEEDS_CONFIRMATION[next]) setPending(next);
    else void apply(next);
  };

  if (!canUpdate || nextStatuses.length === 0) {
    return <StatusBadge value={status} domain="program" />;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isUpdating} className="gap-2">
            {isUpdating ? <Spinner /> : <StatusBadge value={status} domain="program" />}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Move program to
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {nextStatuses.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => handleSelect(option.value)}
              className="gap-2"
            >
              <StatusBadge value={option.value} domain="program" />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(open) => !open && setPending(null)}
        title={`Move to ${pending?.toLowerCase()}?`}
        description={pending ? NEEDS_CONFIRMATION[pending] : ''}
        confirmLabel={pending === 'LIVE' ? 'Go live' : `Yes, ${pending?.toLowerCase()}`}
        destructive={pending === 'CANCELLED' || pending === 'COMPLETED'}
        onConfirm={async () => {
          if (pending) await apply(pending);
          setPending(null);
        }}
      />
    </>
  );
}
