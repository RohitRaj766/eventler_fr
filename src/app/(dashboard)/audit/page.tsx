'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchAuditLogs } from '@/features/audit/auditSlice';
import { fetchPrograms } from '@/features/program/programSlice';
import { AuditLogTable } from '@/features/audit/components/AuditLogTable';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { PageHeader } from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ALL = '__all__';

/**
 * Security and administration audit log.
 *
 * `GET /audit` accepts only `programId` server-side, so the program picker is
 * a real query parameter while the date range is applied to the returned page
 * on the client.
 */
export default function AuditPage() {
  const dispatch = useAppDispatch();

  const { logs, isLoading, error } = useAppSelector((state) => state.audit);
  const programs = useAppSelector((state) => state.program.programs);
  const activeOrgId = useAppSelector((state) => state.auth.activeOrgId);

  const [programId, setProgramId] = useState<string>(ALL);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    void dispatch(fetchPrograms());
  }, [dispatch, activeOrgId]);

  useEffect(() => {
    void dispatch(fetchAuditLogs(programId === ALL ? {} : { programId }));
  }, [dispatch, programId, activeOrgId]);

  const filtered = useMemo(() => {
    const fromTime = from ? new Date(from).getTime() : null;
    // Include the whole end day rather than stopping at midnight.
    const toTime = to ? new Date(to).getTime() + 24 * 60 * 60 * 1000 : null;

    return logs.filter((log) => {
      const at = new Date(log.createdAt).getTime();
      if (fromTime && at < fromTime) return false;
      if (toTime && at > toTime) return false;
      return true;
    });
  }, [logs, from, to]);

  const hasFilters = programId !== ALL || from || to;

  return (
    <RequirePermission action="audit.read" title="the audit log">
      <div className="space-y-5">
        <PageHeader
          title="Audit log"
          description="An append-only record of security and administration events."
        />

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="audit-program"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Program
            </label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger id="audit-program" className="w-56">
                <SelectValue placeholder="All programs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All programs</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              htmlFor="audit-from"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              From
            </label>
            <Input
              id="audit-from"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="w-40"
            />
          </div>

          <div>
            <label
              htmlFor="audit-to"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              To
            </label>
            <Input
              id="audit-to"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="w-40"
            />
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                setProgramId(ALL);
                setFrom('');
                setTo('');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        <AuditLogTable
          logs={filtered}
          isLoading={isLoading}
          error={error}
          onRetry={() => void dispatch(fetchAuditLogs(programId === ALL ? {} : { programId }))}
        />

        <p className="text-xs text-muted-foreground">
          Note: this deployment is not writing audit entries yet, so the log may be empty even
          after administrative actions. The screen is wired to{' '}
          <code className="font-mono">GET /api/v1/audit</code> and will fill in once the backend
          starts recording.
        </p>
      </div>
    </RequirePermission>
  );
}
