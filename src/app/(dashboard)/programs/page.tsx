'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarRange, Plus, Radio } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { createProgram, fetchPrograms } from '@/features/program/programSlice';
import { CreateProgramModal } from '@/features/program/components/CreateProgramModal';
import { Can } from '@/components/auth/Can';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import { useToast } from '@/hooks/useToast';
import type { Program, ProgramStatus } from '@/types';

type Filter = 'all' | 'active' | 'draft' | 'finished';

const FILTERS: Record<Filter, (status: ProgramStatus) => boolean> = {
  all: () => true,
  active: (status) => status === 'PLANNED' || status === 'PUBLISHED' || status === 'LIVE',
  draft: (status) => status === 'DRAFT',
  finished: (status) => status === 'COMPLETED' || status === 'CANCELLED',
};

export default function ProgramsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const { programs, isLoadingPrograms, programsError } = useAppSelector((state) => state.program);
  const activeOrgId = useAppSelector((state) => state.auth.activeOrgId);

  // `?create=1` lets the dashboard's CTA deep-link straight into the dialog.
  const [createOpen, setCreateOpen] = useState(searchParams.get('create') === '1');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    void dispatch(fetchPrograms());
  }, [dispatch, activeOrgId]);

  const rows = useMemo(
    () => programs.filter((program) => FILTERS[filter](program.status)),
    [programs, filter],
  );

  const handleCreate = async (values: {
    name: string;
    description?: string;
    plannedStartTime: string;
    plannedEndTime: string;
  }) => {
    const result = await dispatch(createProgram(values));
    if (createProgram.rejected.match(result)) {
      toast.error('Could not create the program', result.payload as string);
      return;
    }
    setCreateOpen(false);
    toast.success('Program created', `${result.payload.name} is ready to build.`);
    router.push(`/programs/${result.payload.id}`);
  };

  const columns: DataTableColumn<Program>[] = [
    {
      id: 'name',
      header: 'Program',
      sortValue: (row) => row.name,
      searchValue: (row) => `${row.name} ${row.description ?? ''}`,
      cell: (row) => (
        <div className="min-w-0">
          <Link
            href={`/programs/${row.id}`}
            className="block truncate font-medium text-foreground hover:text-primary hover:underline"
          >
            {row.name}
          </Link>
          {row.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge value={row.status} domain="program" />,
    },
    {
      id: 'published',
      header: 'Published',
      hideOnMobile: true,
      sortValue: (row) => row.publishedAt ?? '',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.publishedAt ? formatDateTime(row.publishedAt) : 'Not published'}
        </span>
      ),
    },
    {
      id: 'updated',
      header: 'Last updated',
      hideOnMobile: true,
      sortValue: (row) => row.updatedAt,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{formatRelativeTime(row.updatedAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end gap-1.5">
          {row.status === 'LIVE' && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/programs/${row.id}/live`}>
                <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                Live
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/programs/${row.id}`}>Open</Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RequirePermission action={['program.read', 'program.create']} title="programs">
      <div className="space-y-5">
        <PageHeader
          title="Programs"
          description="Every event hierarchy in this organization."
          actions={
            <Can action="program.create">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                New program
              </Button>
            </Can>
          }
        />

        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({programs.length})</TabsTrigger>
            <TabsTrigger value="active">
              Active ({programs.filter((p) => FILTERS.active(p.status)).length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Draft ({programs.filter((p) => FILTERS.draft(p.status)).length})
            </TabsTrigger>
            <TabsTrigger value="finished">
              Finished ({programs.filter((p) => FILTERS.finished(p.status)).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          isLoading={isLoadingPrograms}
          error={programsError}
          onRetry={() => void dispatch(fetchPrograms())}
          searchPlaceholder="Search programs…"
          emptyIcon={CalendarRange}
          emptyTitle={filter === 'all' ? 'No programs yet' : 'Nothing in this view'}
          emptyDescription={
            filter === 'all'
              ? 'A program is the root of your event hierarchy. Create your first one to start building the schedule.'
              : 'Try a different filter to see other programs.'
          }
          emptyAction={
            filter === 'all' ? (
              <Can action="program.create">
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create your first program
                </Button>
              </Can>
            ) : undefined
          }
          caption="Event programs"
        />

        <CreateProgramModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSubmit={handleCreate}
        />
      </div>
    </RequirePermission>
  );
}
