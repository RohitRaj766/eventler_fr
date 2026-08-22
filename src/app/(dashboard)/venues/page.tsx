'use client';

import { useEffect, useState } from 'react';
import { Building2, MapPin, Package, Plus, Users } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { createVenue, fetchResources, fetchVenues } from '@/features/venue/venueSlice';
import { fetchOrgMetadata } from '@/features/meta/metaSlice';
import { CreateVenueModal } from '@/features/venue/components/CreateVenueModal';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { Can } from '@/components/auth/Can';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, SkeletonCards } from '@/components/ui/states';
import { useToast } from '@/hooks/useToast';
import type { CreateVenueInput } from '@/utils/validationSchemas';

export default function VenuesPage() {
  const dispatch = useAppDispatch();
  const toast = useToast();

  const { venues, resources, isLoadingVenues, venuesError } = useAppSelector(
    (state) => state.venue,
  );
  const activeOrgId = useAppSelector((state) => state.auth.activeOrgId);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    void dispatch(fetchVenues());
    void dispatch(fetchResources());
  }, [dispatch, activeOrgId]);

  const handleCreate = async (values: CreateVenueInput) => {
    const result = await dispatch(
      createVenue({
        name: values.name,
        building: values.building || undefined,
        capacity: values.capacity,
      }),
    );
    if (createVenue.rejected.match(result)) {
      toast.error('Could not add the venue', result.payload as string);
      return;
    }
    setCreateOpen(false);
    toast.success('Venue added', `${values.name} can now be assigned to nodes.`);
    // Node forms read venues from the metadata cache — keep it in step.
    void dispatch(fetchOrgMetadata());
  };

  return (
    <RequirePermission action="venue.manage" title="venues">
      <div className="space-y-5">
        <PageHeader
          title="Venues"
          description="Rooms, halls and auditoriums your events run in."
          actions={
            <Can action="venue.manage">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add venue
              </Button>
            </Can>
          }
        />

        {venuesError ? (
          <ErrorState message={venuesError} onRetry={() => void dispatch(fetchVenues())} />
        ) : isLoadingVenues && !venues.length ? (
          <SkeletonCards count={3} className="lg:grid-cols-3" />
        ) : venues.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No venues yet"
            description="Add the rooms and halls your events use, then assign them to nodes so people know where to be."
            action={
              <Can action="venue.manage">
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add your first venue
                </Button>
              </Can>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => {
              const venueResources = resources.filter(
                (resource) => resource.venueId === venue.id,
              );
              const scheduledCount = venue._count?.nodes ?? venue.nodes?.length ?? 0;

              return (
                <li key={venue.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-foreground">
                        {venue.name}
                      </h2>
                      {venue.building && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                          {venue.building}
                        </p>
                      )}
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
                    <div>
                      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" aria-hidden="true" />
                        Seats
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                        {venue.capacity ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Package className="h-3 w-3" aria-hidden="true" />
                        Kit
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                        {venueResources.length}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Booked</dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                        {scheduledCount}
                      </dd>
                    </div>
                  </dl>

                  {venueResources.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {venueResources.slice(0, 4).map((resource) => (
                        <li
                          key={resource.id}
                          className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground"
                        >
                          {resource.name} ×{resource.quantity}
                        </li>
                      ))}
                      {venueResources.length > 4 && (
                        <li className="px-1.5 py-0.5 text-xs text-muted-foreground">
                          +{venueResources.length - 4} more
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <CreateVenueModal open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} />
      </div>
    </RequirePermission>
  );
}
