'use client';

import { useEffect } from 'react';
import { Clock, MapPin, Pencil, Plus, Timer, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchTasksByNode } from '@/features/task/taskSlice';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState, SkeletonText } from '@/components/ui/states';
import { Can } from '@/components/auth/Can';
import { DependencyPanel } from '@/features/dependency/components/DependencyPanel';
import { TaskListPanel } from '@/features/task/components/TaskListPanel';
import {
  durationBetween,
  formatDateTime,
  formatDuration,
  formatTimeOnly,
  getNodeTypeLabel,
  nodeDelayMinutes,
} from '@/utils/formatters';
import type { EventNode } from '@/types';

interface NodeInspectorProps {
  node: EventNode | null;
  programId: string;
  onEdit: (node: EventNode) => void;
  onDelete: (node: EventNode) => void;
  onAddChild: (node: EventNode) => void;
  onAddDependency: (node: EventNode) => void;
  onAddTask: (node: EventNode) => void;
  onRecordTime: (node: EventNode) => void;
}

function TimeRow({
  label,
  start,
  end,
  emphasis,
}: {
  label: string;
  start?: string | null;
  end?: string | null;
  emphasis?: boolean;
}) {
  if (!start && !end) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={
          emphasis
            ? 'text-sm font-medium tabular-nums text-foreground'
            : 'text-sm tabular-nums text-muted-foreground'
        }
      >
        {formatTimeOnly(start)} – {formatTimeOnly(end)}
      </dd>
    </div>
  );
}

/**
 * Detail panel for the selected node.
 *
 * Planned, projected and actual times are shown together rather than one
 * "time" field, because the gap between them is the whole point of the live
 * engine — that difference is what the delay badge is measuring.
 */
export function NodeInspector({
  node,
  programId,
  onEdit,
  onDelete,
  onAddChild,
  onAddDependency,
  onAddTask,
  onRecordTime,
}: NodeInspectorProps) {
  const dispatch = useAppDispatch();
  const tasksByNode = useAppSelector((state) => state.task.byNode);

  useEffect(() => {
    if (node?.id) void dispatch(fetchTasksByNode(node.id));
  }, [dispatch, node?.id]);

  if (!node) {
    return (
      <EmptyState
        icon={Clock}
        title="Select a node"
        description="Pick anything in the event tree to see its timing, venue, tasks and dependencies."
        className="h-full border-0"
      />
    );
  }

  const delay = nodeDelayMinutes(node);
  const plannedDuration = durationBetween(node.plannedStartTime, node.plannedEndTime);
  const tasks = tasksByNode[node.id];
  const isRoot = !node.parentId;

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {getNodeTypeLabel(node.type, node.customTypeName)}
            </p>
            <h2 className="mt-0.5 truncate text-base font-semibold text-foreground">{node.name}</h2>
          </div>
          <StatusBadge value={node.status} />
        </div>

        {node.description && (
          <p className="mt-2 text-sm text-muted-foreground">{node.description}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Can action="node.update">
            <Button variant="outline" size="sm" onClick={() => onEdit(node)}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </Button>
          </Can>
          <Can action="node.create">
            <Button variant="outline" size="sm" onClick={() => onAddChild(node)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add child
            </Button>
          </Can>
          <Can action="timeline.update">
            <Button variant="outline" size="sm" onClick={() => onRecordTime(node)}>
              <Timer className="h-3.5 w-3.5" aria-hidden="true" />
              Record time
            </Button>
          </Can>
          {!isRoot && (
            <Can action="node.delete">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(node)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Delete
              </Button>
            </Can>
          )}
        </div>
      </header>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <Tabs defaultValue="details" className="flex h-full flex-col">
          <TabsList className="mx-4 mt-3 grid w-auto grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="tasks">Tasks{tasks?.length ? ` (${tasks.length})` : ''}</TabsTrigger>
            <TabsTrigger value="dependencies">Links</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="p-4">
            <section className="rounded-lg border border-border p-3.5">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Schedule
              </h3>
              <dl className="divide-y divide-border">
                <TimeRow label="Planned" start={node.plannedStartTime} end={node.plannedEndTime} />
                <TimeRow
                  label="Projected"
                  start={node.projectedStartTime}
                  end={node.projectedEndTime}
                  emphasis
                />
                {(node.actualStartTime || node.actualEndTime) && (
                  <TimeRow
                    label="Actual"
                    start={node.actualStartTime}
                    end={node.actualEndTime}
                    emphasis
                  />
                )}
                <div className="flex items-baseline justify-between gap-3 py-1.5">
                  <dt className="text-xs text-muted-foreground">Planned duration</dt>
                  <dd className="text-sm tabular-nums text-muted-foreground">
                    {formatDuration(plannedDuration)}
                  </dd>
                </div>
                {delay !== 0 && (
                  <div className="flex items-baseline justify-between gap-3 py-1.5">
                    <dt className="text-xs text-muted-foreground">Variance</dt>
                    <dd
                      className={
                        delay > 0
                          ? 'text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400'
                          : 'text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400'
                      }
                    >
                      {delay > 0 ? `${formatDuration(delay)} late` : `${formatDuration(-delay)} early`}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="mt-3 rounded-lg border border-border p-3.5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Venue
              </h3>
              {node.venue ? (
                <p className="flex items-start gap-2 text-sm text-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span>
                    {node.venue.name}
                    {node.venue.building && (
                      <span className="block text-xs text-muted-foreground">
                        {node.venue.building}
                        {node.venue.capacity ? ` · seats ${node.venue.capacity}` : ''}
                      </span>
                    )}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No venue assigned.</p>
              )}
            </section>

            <p className="mt-3 px-1 text-xs text-muted-foreground">
              Created {formatDateTime(node.createdAt)} · version {node.version}
            </p>
          </TabsContent>

          <TabsContent value="tasks" className="p-4">
            {tasks === undefined ? (
              <SkeletonText lines={3} />
            ) : (
              <TaskListPanel tasks={tasks} onAddTask={() => onAddTask(node)} />
            )}
          </TabsContent>

          <TabsContent value="dependencies" className="p-4">
            <DependencyPanel
              node={node}
              programId={programId}
              onAddDependency={() => onAddDependency(node)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
