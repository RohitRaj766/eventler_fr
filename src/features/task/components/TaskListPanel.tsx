'use client';

import { ListChecks, Plus } from 'lucide-react';
import type { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/states';
import { Can } from '@/components/auth/Can';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatRelativeTime, fullName, initialsOf } from '@/utils/formatters';
import { useNow } from '@/hooks/useNow';
import { cn } from '@/lib/utils';

/** Compact task list used inside the node inspector. */
export function TaskListPanel({
  tasks,
  onAddTask,
  onSelectTask,
}: {
  tasks: Task[];
  onAddTask: () => void;
  onSelectTask?: (task: Task) => void;
}) {
  const now = useNow();

  if (!tasks.length) {
    return (
      <EmptyState
        icon={ListChecks}
        title="No tasks on this node"
        description="Add a task so whoever is responsible knows what needs doing here."
        action={
          <Can action="task.create">
            <Button size="sm" onClick={onAddTask}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add task
            </Button>
          </Can>
        }
        className="py-8"
      />
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const overdue =
          now &&
          task.deadline &&
          task.status !== 'COMPLETED' &&
          new Date(task.deadline).getTime() < now;

        return (
          <button
            key={task.id}
            type="button"
            onClick={onSelectTask ? () => onSelectTask(task) : undefined}
            disabled={!onSelectTask}
            className={cn(
              'w-full rounded-lg border border-border p-3 text-left transition-colors',
              onSelectTask ? 'hover:bg-muted/60' : 'cursor-default',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 text-sm font-medium text-foreground">{task.title}</p>
              <StatusBadge value={task.priority} domain="priority" />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge value={task.status} domain="task" />
              {task.deadline && (
                <span
                  className={cn(
                    'text-xs',
                    overdue ? 'font-medium text-destructive' : 'text-muted-foreground',
                  )}
                >
                  {overdue ? 'Overdue ' : 'Due '}
                  {formatRelativeTime(task.deadline)}
                </span>
              )}

              {Boolean(task.assignments?.length) && (
                <span className="ml-auto flex -space-x-1.5">
                  {task.assignments!.slice(0, 3).map((assignment) => (
                    <Avatar
                      key={assignment.id}
                      className="h-5 w-5 ring-2 ring-card"
                      title={fullName(assignment.user)}
                    >
                      <AvatarFallback className="bg-muted text-[9px] font-semibold">
                        {initialsOf(assignment.user)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {task.assignments!.length > 3 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold ring-2 ring-card">
                      +{task.assignments!.length - 3}
                    </span>
                  )}
                </span>
              )}
            </div>
          </button>
        );
      })}

      <Can action="task.create">
        <Button variant="outline" size="sm" className="w-full" onClick={onAddTask}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add task
        </Button>
      </Can>
    </div>
  );
}
