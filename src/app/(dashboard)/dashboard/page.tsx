'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  Plus,
  Radio,
  Users,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchPrograms } from '@/features/program/programSlice';
import { fetchOrgTasks } from '@/features/task/taskSlice';
import { fetchOrganizationDetails } from '@/features/org/orgSlice';
import { usePermissions } from '@/hooks/usePermission';
import { useNow } from '@/hooks/useNow';
import { Can } from '@/components/auth/Can';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, SkeletonCards, SkeletonText } from '@/components/ui/states';
import { formatDateTime, formatRelativeTime, fullName } from '@/utils/formatters';
import type { Program, Task } from '@/types';

const ACTIVE_PROGRAM_STATUSES = new Set(['PLANNED', 'PUBLISHED', 'LIVE']);
const OPEN_TASK_STATUSES = new Set(['PENDING', 'IN_PROGRESS', 'READY', 'BLOCKED']);

/**
 * Operations overview.
 *
 * Every number is derived from the programs and tasks the API returns for the
 * active organization — nothing here is a placeholder. When the org is empty
 * the page says so and points at the next action instead of showing zeros.
 */
export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { can } = usePermissions();
  // Read the clock outside render so overdue counts stay pure and self-refresh.
  const now = useNow();

  const user = useAppSelector((state) => state.auth.user);
  const activeOrgId = useAppSelector((state) => state.auth.activeOrgId);
  const { programs, isLoadingPrograms, programsError } = useAppSelector((state) => state.program);
  const { tasks, isLoading: isLoadingTasks } = useAppSelector((state) => state.task);
  const orgDetails = useAppSelector((state) => state.org.details);

  const canReadPrograms = can(['program.read', 'program.create']);
  const canReadTasks = can('task.read');

  useEffect(() => {
    if (canReadPrograms) void dispatch(fetchPrograms());
  }, [dispatch, canReadPrograms, activeOrgId]);

  useEffect(() => {
    if (canReadTasks) void dispatch(fetchOrgTasks());
  }, [dispatch, canReadTasks, activeOrgId]);

  useEffect(() => {
    if (activeOrgId && can('org.read')) void dispatch(fetchOrganizationDetails(activeOrgId));
  }, [dispatch, activeOrgId, can]);

  const stats = useMemo(() => {
    const live = programs.filter((program) => program.status === 'LIVE');
    const active = programs.filter((program) => ACTIVE_PROGRAM_STATUSES.has(program.status));
    const completed = programs.filter((program) => program.status === 'COMPLETED');
    const drafts = programs.filter((program) => program.status === 'DRAFT');

    const openTasks = tasks.filter((task) => OPEN_TASK_STATUSES.has(task.status));
    const urgent = openTasks.filter(
      (task) => task.priority === 'URGENT' || task.priority === 'HIGH',
    );
    const overdue = now
      ? openTasks.filter((task) => task.deadline && new Date(task.deadline).getTime() < now)
      : [];

    return { live, active, completed, drafts, openTasks, urgent, overdue };
  }, [programs, tasks, now]);

  const recentPrograms = useMemo(
    () =>
      [...programs]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
    [programs],
  );

  const priorityTasks = useMemo(
    () =>
      [...stats.openTasks]
        .sort((a, b) => {
          const rank = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
          const byPriority = rank[a.priority] - rank[b.priority];
          if (byPriority !== 0) return byPriority;
          const aDue = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const bDue = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          return aDue - bDue;
        })
        .slice(0, 6),
    [stats.openTasks],
  );

  const isLoading = isLoadingPrograms || isLoadingTasks;
  const isEmptyOrg = !isLoading && !programs.length && !tasks.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good to see you, ${user?.firstName ?? 'there'}`}
        description={
          orgDetails
            ? `${orgDetails.name} · ${orgDetails._count?.members ?? 0} members · ${orgDetails._count?.programs ?? 0} programs`
            : 'Your event operations at a glance.'
        }
        actions={
          <Can action="program.create">
            <Button asChild>
              <Link href="/programs?create=1">
                <Plus className="h-4 w-4" aria-hidden="true" />
                New program
              </Link>
            </Button>
          </Can>
        }
      />

      {programsError ? (
        <ErrorState message={programsError} onRetry={() => void dispatch(fetchPrograms())} />
      ) : isEmptyOrg ? (
        <EmptyState
          icon={CalendarRange}
          title="No programs yet"
          description="A program is the root of your event hierarchy. Create your first one to start building the schedule."
          action={
            <Can
              action="program.create"
              fallback={
                <p className="text-xs text-muted-foreground">
                  Ask an organization admin to create the first program.
                </p>
              }
            >
              <Button asChild>
                <Link href="/programs?create=1">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create your first program
                </Link>
              </Button>
            </Can>
          }
        />
      ) : (
        <>
          {isLoading && !programs.length ? (
            <SkeletonCards />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Live now"
                value={stats.live.length}
                caption={
                  stats.live.length
                    ? stats.live.map((program) => program.name).join(', ')
                    : 'Nothing running right now'
                }
                icon={Radio}
                tone={stats.live.length ? 'danger' : 'default'}
                href={stats.live.length ? `/programs/${stats.live[0].id}/live` : undefined}
                linkLabel="Open live mode"
              />
              <StatCard
                label="Active programs"
                value={stats.active.length}
                caption={`${stats.drafts.length} still in draft`}
                icon={CalendarRange}
                tone="primary"
                href="/programs"
                linkLabel="View programs"
              />
              <StatCard
                label="Open tasks"
                value={stats.openTasks.length}
                caption={`${stats.urgent.length} high or urgent`}
                icon={ClipboardList}
                tone={stats.urgent.length ? 'warning' : 'default'}
                href={canReadTasks ? '/tasks' : undefined}
                linkLabel="View tasks"
              />
              <StatCard
                label="Overdue tasks"
                value={stats.overdue.length}
                caption={stats.overdue.length ? 'Past their deadline' : 'Nothing overdue'}
                icon={stats.overdue.length ? AlertTriangle : CheckCircle2}
                tone={stats.overdue.length ? 'danger' : 'success'}
                href={canReadTasks ? '/tasks' : undefined}
                linkLabel="Review"
              />
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-3">
            <section className="rounded-xl border border-border bg-card lg:col-span-2">
              <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <h2 className="text-sm font-semibold text-foreground">Recent programs</h2>
                <Link
                  href="/programs"
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  View all <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </header>

              {isLoadingPrograms && !programs.length ? (
                <SkeletonText lines={4} className="p-5" />
              ) : recentPrograms.length === 0 ? (
                <EmptyState
                  icon={CalendarRange}
                  title="No programs yet"
                  description="Create a program to start scheduling."
                  className="border-0 bg-transparent"
                />
              ) : (
                <ul className="divide-y divide-border">
                  {recentPrograms.map((program: Program) => (
                    <li key={program.id}>
                      <Link
                        href={`/programs/${program.id}`}
                        className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {program.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            Updated {formatRelativeTime(program.updatedAt)}
                          </span>
                        </span>
                        <StatusBadge value={program.status} domain="program" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-border bg-card">
              <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
                <h2 className="text-sm font-semibold text-foreground">Needs attention</h2>
                {canReadTasks && (
                  <Link
                    href="/tasks"
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    All tasks <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                )}
              </header>

              {!canReadTasks ? (
                <EmptyState
                  icon={ClipboardList}
                  title="Tasks are not visible to your role"
                  className="border-0 bg-transparent"
                />
              ) : isLoadingTasks && !tasks.length ? (
                <SkeletonText lines={4} className="p-5" />
              ) : priorityTasks.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Nothing outstanding"
                  description="Every task is done or cancelled."
                  className="border-0 bg-transparent"
                />
              ) : (
                <ul className="divide-y divide-border">
                  {priorityTasks.map((task: Task) => {
                    const overdue =
                      now && task.deadline && new Date(task.deadline).getTime() < now;
                    return (
                      <li key={task.id} className="px-5 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                            {task.title}
                          </p>
                          <StatusBadge value={task.priority} domain="priority" />
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {task.node?.name ?? 'Unassigned node'}
                          {task.deadline && (
                            <span className={overdue ? 'text-destructive' : undefined}>
                              {' · '}
                              {overdue ? 'Overdue ' : 'Due '}
                              {formatRelativeTime(task.deadline)}
                            </span>
                          )}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <Can action="org.read">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Members"
                value={orgDetails?._count?.members ?? '—'}
                icon={Users}
                href="/organization/members"
                linkLabel="Manage members"
              />
              <StatCard
                label="Venues"
                value={orgDetails?._count?.venues ?? '—'}
                icon={Building2}
                href="/venues"
                linkLabel="Manage venues"
              />
              <StatCard
                label="Completed programs"
                value={stats.completed.length}
                caption={
                  stats.completed.length
                    ? `Most recent ${formatDateTime(stats.completed[0]?.updatedAt)}`
                    : 'None finished yet'
                }
                icon={Activity}
              />
            </div>
          </Can>
        </>
      )}

      <p className="sr-only">Signed in as {fullName(user)}</p>
    </div>
  );
}
