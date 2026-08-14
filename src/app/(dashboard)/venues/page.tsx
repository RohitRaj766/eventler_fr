'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchVenues, fetchResources } from '@/features/venue/venueSlice';
import { VenueGrid } from '@/features/venue/components/VenueGrid';

export default function VenuesPage() {
  const dispatch = useAppDispatch();
  const { venues, resources } = useAppSelector((state) => state.venue);

  useEffect(() => {
    dispatch(fetchVenues());
    dispatch(fetchResources());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <VenueGrid venues={venues} resources={resources} />
    </div>
  );
}
