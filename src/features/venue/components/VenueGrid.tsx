import { useState } from 'react';
import { Venue, Resource } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Users, Cpu, Calendar, Clock, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { VenueDetailModal } from './VenueDetailModal';

interface VenueGridProps {
  venues: (Venue & { nodes?: any[] })[];
  resources: (Resource & { venue?: { name: string } | null })[];
  onAddVenue?: () => void;
  onAddResource?: () => void;
}

export function VenueGrid({ venues, resources, onAddVenue, onAddResource }: VenueGridProps) {
  const [selectedVenue, setSelectedVenue] = useState<(Venue & { nodes?: any[] }) | null>(null);

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
              Manage institutional halls, buildings, and real-time booking availability.
            </CardDescription>
          </div>
          <Button onClick={onAddVenue} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-3 rounded-xl shadow-md">
            <Plus className="mr-1.5 h-4 w-4" /> Add Venue
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {venues.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
              <Building2 className="mx-auto h-8 w-8 opacity-40 mb-2 text-indigo-400" />
              <p className="text-sm font-medium text-slate-200">No venues registered yet.</p>
              <p className="text-xs text-muted-foreground">Add your main hall, seminar room, or ground.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {venues.map((venue) => {
                const activeNodes = venue.nodes || [];
                const now = new Date();

                const liveSession = activeNodes.find((n) => {
                  if (n.status === 'IN_PROGRESS') return true;
                  const start = new Date(n.plannedStartTime);
                  const end = new Date(n.plannedEndTime);
                  return n.status === 'SCHEDULED' && now >= start && now <= end;
                });

                const upcomingSessions = activeNodes.filter((n) => {
                  const start = new Date(n.plannedStartTime);
                  return n.id !== liveSession?.id && start > now && n.status !== 'COMPLETED' && n.status !== 'CANCELLED';
                });

                const isCurrentlyOccupied = !!liveSession;
                const isReservedUpcoming = !isCurrentlyOccupied && upcomingSessions.length > 0;
                const activeSession = liveSession || upcomingSessions[0];

                return (
                  <div
                    key={venue.id}
                    onClick={() => setSelectedVenue(venue)}
                    className={`flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition-all cursor-pointer group hover:scale-[1.01] ${
                      isCurrentlyOccupied
                        ? 'bg-slate-900/90 border-rose-500/40 hover:border-rose-500/80 shadow-rose-500/5'
                        : isReservedUpcoming
                        ? 'bg-slate-900/90 border-amber-500/40 hover:border-amber-500/80 shadow-amber-500/5'
                        : 'bg-card border-border/70 hover:border-indigo-500/60 shadow-indigo-500/5'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-base text-foreground tracking-tight flex items-center gap-2">
                            {venue.name}
                          </h4>
                          {venue.building && (
                            <p className="text-xs text-slate-400 font-medium">
                              Building: {venue.building}
                            </p>
                          )}
                        </div>

                        {venue.capacity && (
                          <Badge variant="outline" className="text-[11px] font-bold border-slate-700 bg-slate-800 text-slate-200">
                            <Users className="mr-1 h-3 w-3 text-indigo-400" /> Cap: {venue.capacity}
                          </Badge>
                        )}
                      </div>

                      {/* Booking / Reservation Status Card */}
                      {isCurrentlyOccupied ? (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 animate-pulse" /> LIVE OCCUPIED NOW
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[9px]">
                              {activeSession.status}
                            </span>
                          </div>
                          <p className="font-bold text-white text-xs truncate">
                            {activeSession.program?.name ? `${activeSession.program.name} • ` : ''}{activeSession.name}
                          </p>
                          <p className="text-[11px] text-slate-300 font-mono flex items-center gap-1">
                            <Clock className="h-3 w-3 text-rose-400" />
                            {new Date(activeSession.plannedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(activeSession.plannedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ) : isReservedUpcoming ? (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> RESERVED (UPCOMING)
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px]">
                              {activeSession.status}
                            </span>
                          </div>
                          <p className="font-bold text-white text-xs truncate">
                            {activeSession.program?.name ? `${activeSession.program.name} • ` : ''}{activeSession.name}
                          </p>
                          <p className="text-[11px] text-slate-300 font-mono flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-400" />
                            {new Date(activeSession.plannedStartTime).toLocaleDateString()} ({new Date(activeSession.plannedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl flex items-center justify-between text-xs text-emerald-400">
                          <span className="flex items-center gap-1.5 font-bold">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Available for Booking
                          </span>
                          <span className="text-[10px] font-mono text-emerald-500/80">No live event</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                      <span>{venue.resources?.length || 0} equipment resources</span>
                      {isCurrentlyOccupied ? (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" /> Live In Use
                        </span>
                      ) : isReservedUpcoming ? (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-amber-400" /> Reserved
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Available
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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
          <Button onClick={onAddResource} size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs font-bold h-9">
            <Plus className="mr-1.5 h-4 w-4" /> Add Resource
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {resources.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
              <Cpu className="mx-auto h-8 w-8 opacity-40 mb-2 text-indigo-400" />
              <p className="text-sm font-medium text-slate-200">No equipment resources listed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {resources.map((res) => {
                const isAssigned = !!res.venueId;
                return (
                  <div key={res.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{res.name}</span>
                      <Badge className="text-[10px] bg-indigo-500/10 text-indigo-300 border-indigo-500/20 font-bold">
                        Qty: {res.quantity}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">Type: <span className="text-slate-200 capitalize">{res.type}</span></p>

                    <div className="pt-2 border-t border-slate-800/60">
                      {isAssigned ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold block truncate">
                          Allocated to {res.venue?.name || 'Venue'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold block truncate">
                          ✓ Available in Central Stock
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Venue Schedule & Booking Timeline Modal */}
      <VenueDetailModal
        isOpen={!!selectedVenue}
        onClose={() => setSelectedVenue(null)}
        venue={selectedVenue}
      />
    </div>
  );
}

