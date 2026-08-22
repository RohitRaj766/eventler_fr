'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock, PlayCircle, Radio, Timer } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchProgramTree } from '@/features/program/programSlice';
import {
  applyRealtimeScheduleChange,
  fetchScheduleChanges,
} from '@/features/liveEngine/liveEngineSlice';
import { RecordActualTimeModal } from '@/features/liveEngine/components/RecordActualTimeModal';
import { SchedulePropagationTimeline } from '@/features/liveEngine/components/SchedulePropagationTimeline';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { Can } from '@/components/auth/Can';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatCard } from '@/components/ui/stat-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { useToast } from '@/hooks/useToast';
import { useRealtimeChannel, useRealtimeEvent, roomFor } from '@/hooks/useRealtime';
import { REALTIME_EVENTS } from '@/services/socket';
import { flattenForest } from '@/utils/nodeTreeHelpers';
import {
  formatDuration,
  formatTimeOnly,
  getNodeTypeLabel,
  nodeDelayMinutes,
} from '@/utils/formatters';
import type { EventNode, ScheduleChange } from '@/types';
import { cn } from '@/lib/utils';

/** Leaf-first, chronological — the order an operator actually works through. */
function runOrder(nodes: EventNode[]): EventNode[] {
  return [...nodes]
    .filter((node) => node.parentId) // the program root is not a run item
    .sort(
      (a, b) =>
        new Date(a.projectedStartTime).getTime() - new Date(b.projectedStartTime).getTime(),
    );
}

function NodeRunRow({
  node,
  onRecord,
  highlight,
}: {
  node: EventNode;
  onRecord: () => void;
  highlight?: 'live' | 'next';
}) {
  const delay = nodeDelayMinutes(node);

  return (
    <li
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border p-3',
        highlight === 'live'
          ? 'border-red-400 bg-red-50/60 dark:border-red-700 dark:bg-red-950/30'
          : highlight === 'next'
            ? 'border-primary/40 bg-accent/40'
            : 'border-border bg-card',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{node.name}</p>
          <span className="rounded border border-border px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {getNodeTypeLabel(node.type, node.customTypeName)}
          </span>
          <StatusBadge value={node.status} />
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
          <span>
            Scheduled{' '}
            <span className="tabular-nums">
              {formatTimeOnly(node.plannedStartTime)} – {formatTimeOnly(node.plannedEndTime)}
            </span>
          </span>
          {(node.projectedStartTime !== node.plannedStartTime || delay !== 0) && (
            <span className={delay > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}>
              Projected{' '}
              <span className="tabular-nums">
                {formatTimeOnly(node.projectedStartTime)} – {formatTimeOnly(node.projectedEndTime)}
              </span>
            </span>
          )}
          {node.actualStartTime && (
            <span className="font-medium text-foreground">
              Actual{' '}
              <span className="tabular-nums">
                {formatTimeOnly(node.actualStartTime)}
                {node.actualEndTime ? ` – ${formatTimeOnly(node.actualEndTime)}` : ''}
              </span>
            </span>
          )}
          {delay > 0 && (
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {formatDuration(delay)} behind
            </span>
          )}
        </div>
      </div>

      <Can action="timeline.update">
        <Button
          variant={highlight === 'live' ? 'default' : 'outline'}
          size="sm"
          onClick={onRecord}
          className="shrink-0"
        >
          <Timer className="h-3.5 w-3.5" aria-hidden="true" />
          Record time
        </Button>
      </Can>
    </li>
  );
}

/**
 * Live mode — the operator's view while an event is actually running.
 *
 * Optimised for one job: see what is on now, what is next, and record when
 * things really happened. Recording a time propagates downstream server-side,
 * and the resulting changes land in the history tab.
 */
export default function LiveModePage() {
  const params = useParams<{ id: string }>();
  const programId = params?.id ?? '';
  const dispatch = useAppDispatch();
  const toast = useToast();

  const { current, tree, isLoadingTree, treeError } = useAppSelector((state) => state.program);
  const { scheduleChanges, isLoadingChanges, changesError } = useAppSelector(
    (state) => state.liveEngine,
  );

  const [recordingNode, setRecordingNode] = useState<EventNode | null>(null);

  const refresh = useCallback(() => {
    if (!programId) return;
    void dispatch(fetchProgramTree(programId));
    void dispatch(fetchScheduleChanges(programId));
  }, [dispatch, programId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Live mode refreshes faster than the builder — an operator is watching it.
  const realtimeStatus = useRealtimeChannel({
    room: programId ? roomFor.program(programId) : null,
    refresh,
    intervalMs: 15_000,
    connectedIntervalMs: 60_000,
    enabled: Boolean(programId),
  });

  useRealtimeEvent<ScheduleChange>(
    REALTIME_EVENTS.scheduleChanged,
    (payload) => {
      if (payload?.id) {
        dispatch(applyRealtimeScheduleChange(payload));
        toast.info('Schedule updated', payload.reason);
      }
    },
    Boolean(programId),
  );

  const nodes = useMemo(() => flattenForest(tree), [tree]);
  const ordered = useMemo(() => runOrder(nodes), [nodes]);

  const nodeNames = useMemo(
    () => new Map(nodes.map((node) => [node.id, node.name])),
    [nodes],
  );

  const groups = useMemo(() => {
    const live = ordered.filter((node) => node.status === 'IN_PROGRESS');
    const completed = ordered.filter(
      (node) => node.status === 'COMPLETED' || node.status === 'SKIPPED',
    );
    const upcoming = ordered.filter(
      (node) => !live.includes(node) && !completed.includes(node) && node.status !== 'CANCELLED',
    );
    const delayed = ordered.filter((node) => node.status === 'DELAYED');
    const worstDelay = ordered.reduce((max, node) => Math.max(max, nodeDelayMinutes(node)), 0);
    return { live, completed, upcoming, delayed, worstDelay };
  }, [ordered]);

  if (isLoadingTree && !current) return <LoadingState label="Loading live view…" />;

  if (treeError && !current) {
    return <ErrorState title="Could not load this program" message={treeError} onRetry={refresh} />;
  }

  return (
    <RequirePermission action="timeline.read" title="live mode">
      <div className="space-y-5">
        <PageHeader
          title={current?.name ?? 'Live mode'}
          description="Record what actually happens. Downstream nodes reschedule automatically."
          meta={current && <StatusBadge value={current.status} domain="program" />}
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/programs/${programId}`}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to builder
              </Link>
            </Button>
          }
        />

        {current && current.status !== 'LIVE' && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            This program is <strong>{current.status.toLowerCase()}</strong>, not live. You can still
            record times, but move it to <strong>Live</strong> from the builder when the event
            actually starts.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Running now"
            value={groups.live.length}
            caption={groups.live[0]?.name ?? 'Nothing in progress'}
            icon={Radio}
            tone={groups.live.length ? 'danger' : 'default'}
          />
          <StatCard
            label="Up next"
            value={groups.upcoming.length}
            caption={groups.upcoming[0]?.name ?? 'Nothing scheduled'}
            icon={PlayCircle}
            tone="primary"
          />
          <StatCard
            label="Running behind"
            value={groups.delayed.length}
            caption={
              groups.worstDelay > 0 ? `Worst case ${formatDuration(groups.worstDelay)}` : 'On schedule'
            }
            icon={Clock}
            tone={groups.delayed.length ? 'warning' : 'success'}
          />
          <StatCard
            label="Completed"
            value={groups.completed.length}
            caption={`of ${ordered.length} scheduled items`}
            icon={CheckCircle2}
            tone="success"
          />
        </div>

        <Tabs defaultValue="runsheet">
          <TabsList>
            <TabsTrigger value="runsheet">Run sheet</TabsTrigger>
            <TabsTrigger value="history">
              Change history{scheduleChanges.length ? ` (${scheduleChanges.length})` : ''}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="runsheet" className="mt-4 space-y-6">
            {ordered.length === 0 ? (
              <EmptyState
                icon={Radio}
                title="Nothing to run yet"
                description="Add activities and sessions in the builder, then come back here to run the event."
                action={
                  <Button asChild>
                    <Link href={`/programs/${programId}`}>Open the builder</Link>
                  </Button>
                }
              />
            ) : (
              <>
                {groups.live.length > 0 && (
                  <section>
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="h-2 w-2 animate-live-pulse rounded-full bg-red-500" aria-hidden="true" />
                      On now
                    </h2>
                    <ul className="space-y-2">
                      {groups.live.map((node) => (
                        <NodeRunRow
                          key={node.id}
                          node={node}
                          highlight="live"
                          onRecord={() => setRecordingNode(node)}
                        />
                      ))}
                    </ul>
                  </section>
                )}

                {groups.upcoming.length > 0 && (
                  <section>
                    <h2 className="mb-2 text-sm font-semibold text-foreground">Coming up</h2>
                    <ul className="space-y-2">
                      {groups.upcoming.map((node, index) => (
                        <NodeRunRow
                          key={node.id}
                          node={node}
                          highlight={index === 0 && !groups.live.length ? 'next' : undefined}
                          onRecord={() => setRecordingNode(node)}
                        />
                      ))}
                    </ul>
                  </section>
                )}

                {groups.completed.length > 0 && (
                  <section>
                    <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Done</h2>
                    <ul className="space-y-2 opacity-75">
                      {groups.completed.map((node) => (
                        <NodeRunRow
                          key={node.id}
                          node={node}
                          onRecord={() => setRecordingNode(node)}
                        />
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {changesError ? (
              <ErrorState
                message={changesError}
                onRetry={() => void dispatch(fetchScheduleChanges(programId))}
              />
            ) : (
              <SchedulePropagationTimeline
                changes={scheduleChanges}
                isLoading={isLoadingChanges}
                nodeNames={nodeNames}
              />
            )}
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground">
          {realtimeStatus === 'connected'
            ? 'Connected — updates arrive as they happen.'
            : 'Realtime is unavailable on this server, so this view refreshes every 15 seconds instead.'}
        </p>

        <RecordActualTimeModal
          open={Boolean(recordingNode)}
          onOpenChange={(open) => !open && setRecordingNode(null)}
          node={recordingNode}
          programId={programId}
          onRecorded={refresh}
        />
      </div>
    </RequirePermission>
  );
}
