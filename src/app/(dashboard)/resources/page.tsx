'use client';

import { useEffect, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { createResource, fetchResources, fetchVenues } from '@/features/venue/venueSlice';
import { CreateResourceModal } from '@/features/venue/components/CreateResourceModal';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { Can } from '@/components/auth/Can';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { useToast } from '@/hooks/useToast';
import type { PhysicalResource } from '@/types';
import type { CreateResourceInput } from '@/utils/validationSchemas';

export default function ResourcesPage() {
  const dispatch = useAppDispatch();
  const toast = useToast();

  const { resources, venues, isLoadingResources, resourcesError } = useAppSelector(
    (state) => state.venue,
  );
  const activeOrgId = useAppSelector((state) => state.auth.activeOrgId);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    void dispatch(fetchResources());
    void dispatch(fetchVenues());
  }, [dispatch, activeOrgId]);

  const handleCreate = async (values: CreateResourceInput) => {
    const result = await dispatch(
      createResource({
        name: values.name,
        type: values.type.toUpperCase(),
        quantity: values.quantity,
        venueId: values.venueId || undefined,
      }),
    );
    if (createResource.rejected.match(result)) {
      toast.error('Could not register the resource', result.payload as string);
      return;
    }
    setCreateOpen(false);
    toast.success('Resource registered');
  };

  const columns: DataTableColumn<PhysicalResource>[] = [
    {
      id: 'name',
      header: 'Resource',
      sortValue: (row) => row.name,
      searchValue: (row) => `${row.name} ${row.type} ${row.venue?.name ?? ''}`,
      cell: (row) => <span className="text-sm font-medium text-foreground">{row.name}</span>,
    },
    {
      id: 'type',
      header: 'Type',
      sortValue: (row) => row.type,
      cell: (row) => (
        <span className="rounded border border-border px-1.5 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {row.type}
        </span>
      ),
    },
    {
      id: 'quantity',
      header: 'Quantity',
      align: 'right',
      sortValue: (row) => row.quantity,
      cell: (row) => (
        <span className="text-sm tabular-nums text-foreground">{row.quantity}</span>
      ),
    },
    {
      id: 'venue',
      header: 'Home venue',
      hideOnMobile: true,
      sortValue: (row) => row.venue?.name ?? '',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.venue?.name ?? 'Not assigned'}
        </span>
      ),
    },
  ];

  return (
    <RequirePermission action="venue.manage" title="resources">
      <div className="space-y-5">
        <PageHeader
          title="Physical resources"
          description="Equipment your events depend on — projectors, microphones, podiums, laptops."
          actions={
            <Can action="venue.manage">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Register resource
              </Button>
            </Can>
          }
        />

        <DataTable
          columns={columns}
          rows={resources}
          rowKey={(row) => row.id}
          isLoading={isLoadingResources}
          error={resourcesError}
          onRetry={() => void dispatch(fetchResources())}
          searchPlaceholder="Search resources…"
          emptyIcon={Package}
          emptyTitle="No resources yet"
          emptyDescription="Register the equipment your events rely on so coordinators can see what's available."
          emptyAction={
            <Can action="venue.manage">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Register your first resource
              </Button>
            </Can>
          }
          caption="Physical resources"
        />

        <CreateResourceModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          venues={venues}
          onSubmit={handleCreate}
        />
      </div>
    </RequirePermission>
  );
}
