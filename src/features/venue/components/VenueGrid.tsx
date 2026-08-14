'use client';

import { Venue, Resource } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Users, Cpu } from 'lucide-react';

interface VenueGridProps {
  venues: Venue[];
  resources: Resource[];
  onAddVenue?: () => void;
  onAddResource?: () => void;
}

export function VenueGrid({ venues, resources, onAddVenue, onAddResource }: VenueGridProps) {
  return (
    <div className="space-y-6">
      {/* Venues Card Grid */}
      <Card className="border-border/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-400" />
              Event Venues & Auditoriums
            </CardTitle>
            <CardDescription>
              Manage institutional halls, buildings, and capacity allocations.
            </CardDescription>
          </div>
          <Button onClick={onAddVenue} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Venue
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {venues.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
              <Building2 className="mx-auto h-8 w-8 opacity-40 mb-2" />
              <p className="text-sm font-medium">No venues registered yet.</p>
              <p className="text-xs text-muted-foreground">Add your main hall, seminar room, or ground.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {venues.map((venue) => (
                <div
                  key={venue.id}
                  className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-xs hover:border-primary/40 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-base text-foreground tracking-tight">
                        {venue.name}
                      </h4>
                      {venue.capacity && (
                        <Badge variant="outline" className="text-xs font-semibold">
                          <Users className="mr-1 h-3 w-3" /> Cap: {venue.capacity}
                        </Badge>
                      )}
                    </div>
                    {venue.building && (
                      <p className="text-xs text-muted-foreground font-medium">
                        Building: {venue.building}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>{venue.resources?.length || 0} equipment resources</span>
                    <span className="text-emerald-400 font-medium">Available</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Equipment Resources Card */}
      <Card className="border-border/60 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-400" />
              Equipment & Technical Resources
            </CardTitle>
            <CardDescription>
              Microphones, projectors, sound systems, vehicles & podium setup inventory.
            </CardDescription>
          </div>
          <Button onClick={onAddResource} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" /> Add Resource
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {resources.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
              <Cpu className="mx-auto h-8 w-8 opacity-40 mb-2" />
              <p className="text-sm font-medium">No equipment resources listed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {resources.map((res) => (
                <div key={res.id} className="rounded-lg border bg-card/60 p-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">{res.name}</span>
                    <Badge className="text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                      Qty: {res.quantity}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Type: {res.type}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
