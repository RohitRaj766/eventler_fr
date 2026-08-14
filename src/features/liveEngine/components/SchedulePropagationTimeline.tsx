'use client';

import { ScheduleChange, Node } from '@/types';
import { formatTimeOnly, formatDate } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, ArrowRight, Activity, Clock, ShieldAlert } from 'lucide-react';

interface SchedulePropagationTimelineProps {
  changes: ScheduleChange[];
  activeProgramTree?: Node | null;
}

export function SchedulePropagationTimeline({ changes, activeProgramTree }: SchedulePropagationTimelineProps) {
  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Radio className="h-5 w-5 text-indigo-400 animate-pulse" />
            Topological Impact Propagation Feed
          </CardTitle>
          <CardDescription>
            Authoritative event schedule change stream and downstream impact correlation log.
          </CardDescription>
        </div>
        <Badge variant="outline" className="font-mono text-xs text-emerald-400 border-emerald-500/30">
          <Activity className="mr-1 h-3 w-3" /> Live Socket Sync
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {changes.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Clock className="mx-auto h-8 w-8 opacity-40 mb-2" />
            <p className="text-sm font-medium">No live schedule shifts logged yet.</p>
            <p className="text-xs text-muted-foreground">
              When actual times are recorded, downstream node updates will stream live right here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {changes.map((change) => (
              <div
                key={change.id}
                className="flex flex-col gap-2 rounded-xl border bg-card/80 p-4 shadow-xs transition-all hover:border-indigo-500/40"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 font-mono text-[10px]">
                      Correlation #{change.correlationId.slice(0, 8)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(change.createdAt)}
                    </span>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">
                    <ShieldAlert className="mr-1 h-3 w-3" /> Affected Nodes: {change.affectedNodes?.length || 0}
                  </Badge>
                </div>

                <p className="text-sm font-semibold text-foreground">
                  Reason: <span className="text-primary">{change.reason}</span>
                </p>

                {/* State shift details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 rounded-lg bg-muted/40 p-3 text-xs">
                  <div>
                    <span className="font-semibold text-muted-foreground block mb-1">Previous Schedule State:</span>
                    <pre className="text-[11px] font-mono overflow-x-auto text-amber-400 bg-background/50 p-2 rounded">
                      {JSON.stringify(change.previousState, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground block mb-1">New Projected State:</span>
                    <pre className="text-[11px] font-mono overflow-x-auto text-emerald-400 bg-background/50 p-2 rounded">
                      {JSON.stringify(change.newState, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
