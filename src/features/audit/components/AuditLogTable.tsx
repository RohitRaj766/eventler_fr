'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import type { AuditLog } from '@/types';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDateTime, fullName } from '@/utils/formatters';

/**
 * Audit log table with a detail drawer.
 *
 * Metadata payloads vary by action, so the row keeps only the columns every
 * entry has and the dialog renders the raw record for the rest.
 */
export function AuditLogTable({
  logs,
  isLoading,
  error,
  onRetry,
}: {
  logs: AuditLog[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const actorOf = (row: AuditLog) => row.user ?? row.actor ?? null;

  const columns: DataTableColumn<AuditLog>[] = [
    {
      id: 'action',
      header: 'Action',
      sortValue: (row) => row.action,
      searchValue: (row) =>
        `${row.action} ${row.entityType ?? ''} ${row.resource ?? ''} ${fullName(actorOf(row))}`,
      cell: (row) => (
        <span className="font-mono text-xs font-medium text-foreground">{row.action}</span>
      ),
    },
    {
      id: 'actor',
      header: 'Who',
      sortValue: (row) => fullName(actorOf(row)),
      cell: (row) => {
        const actor = actorOf(row);
        return actor ? (
          <div className="min-w-0">
            <p className="truncate text-sm text-foreground">{fullName(actor)}</p>
            <p className="truncate text-xs text-muted-foreground">{actor.email}</p>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">System</span>
        );
      },
    },
    {
      id: 'resource',
      header: 'Resource',
      hideOnMobile: true,
      sortValue: (row) => row.entityType ?? row.resource ?? '',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.entityType ?? row.resource ?? '—'}
        </span>
      ),
    },
    {
      id: 'when',
      header: 'When',
      sortValue: (row) => row.createdAt,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={logs}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        onRowClick={setSelected}
        searchPlaceholder="Search by action, user or resource…"
        emptyIcon={History}
        emptyTitle="No audit entries"
        emptyDescription="Security and administration events will be recorded here as they happen."
        caption="Security and administration audit log"
      />

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">{selected?.action}</DialogTitle>
            <DialogDescription>
              {selected && formatDateTime(selected.createdAt)}
              {selected && actorOf(selected) && ` · ${fullName(actorOf(selected))}`}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <dl className="space-y-3 text-sm">
              {selected.entityType && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Resource type</dt>
                  <dd className="text-foreground">{selected.entityType}</dd>
                </div>
              )}
              {selected.entityId && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Resource ID</dt>
                  <dd className="truncate font-mono text-xs text-foreground">
                    {selected.entityId}
                  </dd>
                </div>
              )}
              {selected.ipAddress && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">IP address</dt>
                  <dd className="font-mono text-xs text-foreground">{selected.ipAddress}</dd>
                </div>
              )}
              {selected.userAgent && (
                <div>
                  <dt className="text-muted-foreground">User agent</dt>
                  <dd className="mt-1 break-all text-xs text-foreground">{selected.userAgent}</dd>
                </div>
              )}
              {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                <div>
                  <dt className="text-muted-foreground">Details</dt>
                  <dd>
                    <pre className="scrollbar-thin mt-1 max-h-56 overflow-auto rounded-lg bg-muted p-3 text-xs text-foreground">
                      {JSON.stringify(selected.metadata, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
