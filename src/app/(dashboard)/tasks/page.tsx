'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { createTask, fetchOrgTasks, updateTask } from '@/features/task/taskSlice';
import { fetchPrograms, fetchProgramTree } from '@/features/program/programSlice';
import { fetchOrgMembers } from '@/features/org/orgSlice';
import { selectTaskStatusOptions } from '@/features/meta/metaSlice';
import { TaskFormModal, type TaskSubmitValues } from '@/features/task/components/TaskFormModal';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { Can } from '@/components/auth/Can';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/useToast';
import { formatRelativeTime, fullName, humanizeEnum, initialsOf } from '@/utils/formatters';
import { flattenForest } from '@/utils/nodeTreeHelpers';
import type { Task, TaskStatus } from '@/types';

const ALL = '__all__';

/**
 * Org-wide task board.
 *
 * Status is editable inline because that is the change people make most, and
 * each update carries the task's `version` so a concurrent edit is reported as
 * a conflict rather than silently overwriting someone else's work.
 */
export default function TasksPage() {
  const dispatch = useAppDispatch();
  const toast = useToast();

  const { tasks, isLoading, error, isMutating } = useAppSelector((state) => state.task);
  const { programs, tree } = useAppSelector((state) => state.program);
  const members = useAppSelector((state) => state.org.members);
  const statusOptions = useAppSelector(selectTaskStatusOptions);
  const activeOrgId = useAppSelector((state) => state.auth.activeOrgId);

  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [assigneeFilter, setAssigneeFilter] = useState<string>(ALL);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');

  useEffect(() => {
    void dispatch(fetchOrgTasks());
    void dispatch(fetchPrograms());
    if (!members.length) void dispatch(fetchOrgMembers());
  }, [dispatch, activeOrgId, members.length]);

  // The create dialog needs nodes, which only come with a program's tree.
  useEffect(() => {
    if (selectedProgramId) void dispatch(fetchProgramTree(selectedProgramId));
  }, [dispatch, selectedProgramId]);

  const nodes = useMemo(() => flattenForest(tree), [tree]);

  const rows = useMemo(
    () =>
      tasks.filter((task) => {
        if (statusFilter !== ALL && task.status !== statusFilter) return false;
        if (
          assigneeFilter !== ALL &&
          !task.assignments?.some((assignment) => assignment.userId === assigneeFilter)
        ) {
          return false;
        }
        return true;
      }),
    [tasks, statusFilter, assigneeFilter],
  );

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    const result = await dispatch(
      updateTask({ id: task.id, payload: { status, version: task.version } }),
    );
    if (updateTask.rejected.match(result)) {
      const payload = result.payload as { taskId: string | null; message: string };
      toast.error('Could not update the task', payload?.message);
      // On a conflict our copy is stale — reload so the next edit succeeds.
      if (payload?.taskId) void dispatch(fetchOrgTasks());
      return;
    }
    toast.success('Task updated');
  };

  const handleCreate = async (values: TaskSubmitValues) => {
    const result = await dispatch(
      createTask({
        nodeId: values.nodeId,
        title: values.title,
        description: values.description,
        priority: values.priority,
        deadline: values.deadline,
        assigneeUserIds: values.assigneeUserIds,
      }),
    );
    if (createTask.rejected.match(result)) {
      toast.error('Could not create the task', result.payload as string);
      return;
    }
    setCreateOpen(false);
    toast.success('Task created');
    void dispatch(fetchOrgTasks());
  };

  const columns: DataTableColumn<Task>[] = [
    {
      id: 'title',
      header: 'Task',
      sortValue: (row) => row.title,
      searchValue: (row) => `${row.title} ${row.description ?? ''} ${row.node?.name ?? ''}`,
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{row.title}</p>
          {row.node && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {row.node.programId ? (
                <Link
                  href={`/programs/${row.node.programId}`}
                  className="hover:text-foreground hover:underline"
                >
                  {row.node.name}
                </Link>
              ) : (
                row.node.name
              )}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'priority',
      header: 'Priority',
      sortValue: (row) => ({ URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 })[row.priority],
      cell: (row) => <StatusBadge value={row.priority} domain="priority" />,
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      cell: (row) => (
        // Scope matters per row: a Volunteer holds task.update but may only
        // reach tasks assigned to them, so unassigned rows stay read-only.
        <Can
          action="task.update"
          subject={{ kind: 'task', task: row }}
          fallback={<StatusBadge value={row.status} domain="task" />}
        >
          <Select
            value={row.status}
            onValueChange={(value) => void handleStatusChange(row, value as TaskStatus)}
            disabled={isMutating}
          >
            <SelectTrigger
              className="h-8 w-36"
              aria-label={`Status of ${row.title}`}
              onClick={(event) => event.stopPropagation()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {humanizeEnum(option.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Can>
      ),
    },
    {
      id: 'assignees',
      header: 'Assignees',
      hideOnMobile: true,
      cell: (row) =>
        row.assignments?.length ? (
          <span className="flex -space-x-1.5">
            {row.assignments.slice(0, 3).map((assignment) => (
              <Avatar
                key={assignment.id}
                className="h-6 w-6 ring-2 ring-card"
                title={fullName(assignment.user)}
              >
                <AvatarFallback className="bg-muted text-[10px] font-semibold">
                  {initialsOf(assignment.user)}
                </AvatarFallback>
              </Avatar>
            ))}
            {row.assignments.length > 3 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold ring-2 ring-card">
                +{row.assignments.length - 3}
              </span>
            )}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        ),
    },
    {
      id: 'deadline',
      header: 'Due',
      hideOnMobile: true,
      sortValue: (row) => row.deadline ?? '',
      cell: (row) => {
        if (!row.deadline) return <span className="text-sm text-muted-foreground">—</span>;
        const overdue =
          row.status !== 'COMPLETED' && new Date(row.deadline).getTime() < Date.now();
        return (
          <span
            className={
              overdue ? 'text-sm font-medium text-destructive' : 'text-sm text-muted-foreground'
            }
          >
            {formatRelativeTime(row.deadline)}
          </span>
        );
      },
    },
  ];

  return (
    <RequirePermission action="task.read" title="tasks">
      <div className="space-y-5">
        <PageHeader
          title="Tasks"
          description="Everything that needs doing across this organization's events."
          actions={
            <Can action="task.create">
              <Button onClick={() => setCreateOpen(true)} disabled={!programs.length}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                New task
              </Button>
            </Can>
          }
        />

        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {humanizeEnum(option.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-52" aria-label="Filter by assignee">
              <SelectValue placeholder="Anyone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Anyone</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.userId}>
                  {fullName(member.user)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          isLoading={isLoading}
          error={error}
          onRetry={() => void dispatch(fetchOrgTasks())}
          searchPlaceholder="Search tasks…"
          emptyIcon={ClipboardList}
          emptyTitle={tasks.length ? 'No tasks match these filters' : 'No tasks yet'}
          emptyDescription={
            tasks.length
              ? 'Try clearing a filter to see the rest.'
              : 'Tasks attach to nodes in a program. Create one to start tracking what needs doing.'
          }
          emptyAction={
            !tasks.length && programs.length ? (
              <Can action="task.create">
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create a task
                </Button>
              </Can>
            ) : undefined
          }
          caption="Organization tasks"
        />

        {/* Node choices depend on which program is picked first. */}
        {createOpen && !selectedProgramId && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-medium text-foreground">Which program is this task for?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tasks attach to a node, so pick the program to load its nodes.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                <SelectTrigger className="w-64" aria-label="Choose a program">
                  <SelectValue placeholder="Choose a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <TaskFormModal
          open={createOpen && Boolean(selectedProgramId) && nodes.length > 0}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) setSelectedProgramId('');
          }}
          nodes={nodes}
          onSubmit={handleCreate}
        />
      </div>
    </RequirePermission>
  );
}
