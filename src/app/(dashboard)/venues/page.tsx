'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchVenues, fetchResources, createVenue, createResource } from '@/features/venue/venueSlice';
import { VenueGrid } from '@/features/venue/components/VenueGrid';
import { CreateVenueModal } from '@/features/venue/components/CreateVenueModal';
import { CreateResourceModal } from '@/features/venue/components/CreateResourceModal';
import { CreateVenueInput, CreateResourceInput } from '@/utils/validationSchemas';

export default function VenuesPage() {
  const dispatch = useAppDispatch();
  const { venues, resources } = useAppSelector((state) => state.venue);

  const [venueModalOpen, setVenueModalOpen] = useState(false);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchVenues());
    dispatch(fetchResources());
  }, [dispatch]);

  const handleCreateVenue = async (data: CreateVenueInput) => {
    await dispatch(createVenue(data));
  };

  const handleCreateResource = async (data: CreateResourceInput) => {
    await dispatch(createResource(data));
  };

  return (
    <div className="space-y-6">
      <VenueGrid
        venues={venues}
        resources={resources}
        onAddVenue={() => setVenueModalOpen(true)}
        onAddResource={() => setResourceModalOpen(true)}
      />

      <CreateVenueModal
        isOpen={venueModalOpen}
        onClose={() => setVenueModalOpen(false)}
        onSubmit={handleCreateVenue}
      />

      <CreateResourceModal
        isOpen={resourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
        venues={venues}
        onSubmit={handleCreateResource}
      />
    </div>
  );
}
