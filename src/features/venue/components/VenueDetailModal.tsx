'use client';

import { Venue } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Cpu,
  History,
  Radio,
  MapPin,
} from 'lucide-react';

interface VenueDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: (Venue & { nodes?: any[] }) | null;
}

export function VenueDetailModal({ isOpen, onClose, venue }: VenueDetailModalProps) {
  if (!venue) return null;

  const activeNodes = venue.nodes || [];
  const now = new Date();

  // 1. Live active session (currently running right now)
  const liveSession = activeNodes.find((n) => {
    if (n.status === 'IN_PROGRESS') return true;
    const start = new Date(n.plannedStartTime);
    const end = new Date(n.plannedEndTime);
    return n.status === 'SCHEDULED' && now >= start && now <= end;
  });

  // 2. Upcoming sessions (future start time & not completed)
  const upcomingSessions = activeNodes.filter((n) => {
    const start = new Date(n.plannedStartTime);
    return n.id !== liveSession?.id && start > now && n.status !== 'COMPLETED' && n.status !== 'CANCELLED';
  });

  // 3. Past completed sessions (past end time or completed status)
  const pastSessions = activeNodes.filter((n) => {
    const end = new Date(n.plannedEndTime);
    return n.status === 'COMPLETED' || n.status === 'CANCELLED' || (end < now && n.id !== liveSession?.id);
  });

  const isCurrentlyOccupied = !!liveSession;
  const isReservedUpcoming = !isCurrentlyOccupied && upcomingSessions.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl rounded-2xl p-6 overflow-y-auto max-h-[85vh]">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Building2 className="h-5 w-5" />
              </div>
              <span>{venue.name}</span>
            </DialogTitle>

            {isCurrentlyOccupied ? (
              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-xs font-extrabold uppercase flex items-center gap-1.5 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" /> LIVE OCCUPIED
              </Badge>
            ) : isReservedUpcoming ? (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-extrabold uppercase flex items-center gap-1.5 px-3 py-1">
                <Calendar className="h-3.5 w-3.5 text-amber-400" /> RESERVED (UPCOMING)
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-extrabold uppercase flex items-center gap-1.5 px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> AVAILABLE
              </Badge>
            )}
          </div>

          <DialogDescription className="text-xs text-slate-400 flex items-center gap-3 pt-1">
            {venue.building && <span>Building: <strong className="text-slate-200">{venue.building}</strong></span>}
            {venue.capacity && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-indigo-400" /> Seating Capacity: <strong className="text-slate-200">{venue.capacity} seats</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-3">
          {/* Live / Current Active Session Banner */}
          {liveSession ? (
            <div className="p-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-amber-400 animate-pulse" /> LIVE NOW IN STAGE
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                  {liveSession.status}
                </span>
              </div>
              <h4 className="text-base font-bold text-white">
                {liveSession.program?.name ? `${liveSession.program.name} • ` : ''}{liveSession.name}
              </h4>
              <div className="flex items-center gap-4 text-xs text-slate-300 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  {new Date(liveSession.plannedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(liveSession.plannedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2 font-medium text-emerald-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Stage is currently free (No ongoing live session)
              </span>
            </div>
          )}

          {/* Upcoming Reservations Schedule */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-400" /> Upcoming Bookings & Sessions ({upcomingSessions.length})
            </h4>

            {upcomingSessions.length === 0 ? (
              <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-500 text-center">
                No upcoming sessions scheduled for this venue.
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition-colors">
                    <div className="space-y-0.5">
                      <p className="font-bold text-white">{session.name}</p>
                      <p className="text-[11px] text-slate-400">{session.program?.name || 'Institutional Event'}</p>
                    </div>

                    <div className="text-right font-mono text-slate-300 space-y-0.5">
                      <p className="text-indigo-300 font-semibold">{new Date(session.plannedStartTime).toLocaleDateString()}</p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(session.plannedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.plannedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attached Equipment Resources */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-400" /> Allocated Equipment Resources ({venue.resources?.length || 0})
            </h4>

            {(!venue.resources || venue.resources.length === 0) ? (
              <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl text-xs text-slate-500 text-center">
                No equipment resources assigned to this venue.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {venue.resources.map((res: any) => (
                  <div key={res.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{res.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{res.type}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-slate-700 bg-slate-900 text-indigo-300 font-bold">
                      Qty: {res.quantity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Completed History */}
          {pastSessions.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <History className="h-4 w-4 text-slate-500" /> Completed Past Events ({pastSessions.length})
              </h4>
              <div className="space-y-2">
                {pastSessions.map((session) => (
                  <div key={session.id} className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs opacity-75">
                    <span className="font-medium text-slate-300">{session.name}</span>
                    <span className="font-mono text-slate-500 text-[11px]">{new Date(session.plannedStartTime).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
