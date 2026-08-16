import { useEffect, useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { getPriorityBadgeColor } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, Plus, Clock, User as UserIcon } from 'lucide-react';
import { taskService } from '@/services/api';

interface TaskBoardProps {
  tasks: Task[];
  onAddTask?: () => void;
  onUpdateStatus?: (taskId: string, status: TaskStatus, version?: number) => void;
}

const statusColorMap: Record<string, string> = {
  PENDING: 'border-slate-500/40 text-slate-400',
  IN_PROGRESS: 'border-blue-500/40 text-blue-400',
  READY: 'border-cyan-500/40 text-cyan-400',
  COMPLETED: 'border-emerald-500/40 text-emerald-400',
  BLOCKED: 'border-red-500/40 text-red-400',
};

export function TaskBoard({ tasks, onAddTask, onUpdateStatus }: TaskBoardProps) {
  const [statuses, setStatuses] = useState<string[]>(['PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED', 'BLOCKED']);

  useEffect(() => {
    taskService
      .getTaskEnums()
      .then((data) => {
        if (data?.statuses && Array.isArray(data.statuses) && data.statuses.length > 0) {
          setStatuses(data.statuses);
        }
      })
      .catch((err) => console.error('Failed to load dynamic task enums:', err));
  }, []);

  const columns = statuses.map((status) => ({
    status: status as TaskStatus,
    label: status.replace('_', ' '),
    color: statusColorMap[status] || 'border-slate-500/40 text-slate-400',
  }));

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-indigo-400" />
            Node Task & Readiness Kanban Board
          </CardTitle>
          <CardDescription>
            Ensure hall equipment, speakers, and venue resources are marked READY before starting node execution.
          </CardDescription>
        </div>
        <Button onClick={onAddTask} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Create Task
        </Button>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);

            return (
              <div key={col.status} className="flex flex-col rounded-xl bg-card/60 border p-3 min-h-[300px]">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <span className={`font-bold text-xs uppercase ${col.color}`}>
                    {col.label}
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    {colTasks.length}
                  </Badge>
                </div>

                <div className="space-y-3 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border border-dashed rounded-lg">
                      No tasks
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex flex-col gap-2 rounded-lg border bg-background p-3 shadow-xs transition-all hover:border-primary/40"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className={`text-[9px] font-bold border ${getPriorityBadgeColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                          {task.deadline && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        <h5 className="font-semibold text-xs text-foreground tracking-tight">
                          {task.title}
                        </h5>
                        {task.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t mt-1">
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <UserIcon className="h-3 w-3" />
                            <span>{task.assignments?.length || 0} assigned</span>
                          </div>

                          <select
                            value={task.status}
                            onChange={(e) => onUpdateStatus?.(task.id, e.target.value as TaskStatus, task.version)}
                            className="bg-slate-900 text-[10px] font-bold border border-slate-700 rounded px-1.5 py-1 cursor-pointer text-indigo-300 hover:text-white"
                          >
                            {statuses.map((st) => (
                              <option key={st} value={st}>
                                {st.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
