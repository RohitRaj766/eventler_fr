'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchInvoices,
  selectInvoices,
  selectIsBillingPreview,
} from '@/features/billing/billingSlice';
import { BillingPreviewNotice } from '@/features/billing/components/BillingPreviewNotice';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { formatDateOnly } from '@/utils/formatters';
import { formatMoney } from '@/utils/money';
import type { Invoice, InvoiceStatus } from '@/types/billing';
import { cn } from '@/lib/utils';

const INVOICE_TONES: Record<InvoiceStatus, string> = {
  PAID: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700',
  OPEN: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-700',
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-600',
  VOID: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-600',
  UNCOLLECTIBLE: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-700',
};

const INVOICE_LABELS: Record<InvoiceStatus, string> = {
  PAID: 'Paid',
  OPEN: 'Due',
  DRAFT: 'Draft',
  VOID: 'Void',
  UNCOLLECTIBLE: 'Unpaid',
};

/**
 * Invoice history.
 *
 * While billing is in preview these rows are scaffolding, and their numbers
 * say so — a sample row must never read as a genuine financial record. Nothing
 * here produces a document: the download action stays disabled until the
 * backend can hand back a real server-signed PDF.
 */
export default function InvoicesPage() {
  const dispatch = useAppDispatch();

  const activeOrgId = useAppSelector((state) => state.auth.activeOrgId);
  const invoices = useAppSelector(selectInvoices);
  const isLoading = useAppSelector((state) => state.billing.isLoading);
  const error = useAppSelector((state) => state.billing.error);
  const isPreview = selectIsBillingPreview();

  useEffect(() => {
    void dispatch(fetchInvoices());
  }, [dispatch, activeOrgId]);

  const columns: DataTableColumn<Invoice>[] = [
    {
      id: 'number',
      header: 'Invoice',
      sortValue: (row) => row.number,
      searchValue: (row) => `${row.number} ${row.status}`,
      cell: (row) => (
        <span className="font-mono text-xs font-medium text-foreground">{row.number}</span>
      ),
    },
    {
      id: 'period',
      header: 'Period',
      hideOnMobile: true,
      sortValue: (row) => row.periodStart,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDateOnly(row.periodStart)} – {formatDateOnly(row.periodEnd)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortValue: (row) => row.status,
      cell: (row) => (
        <span
          className={cn(
            'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
            INVOICE_TONES[row.status],
          )}
        >
          {INVOICE_LABELS[row.status]}
        </span>
      ),
    },
    {
      id: 'issued',
      header: 'Issued',
      hideOnMobile: true,
      sortValue: (row) => row.issuedAt,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{formatDateOnly(row.issuedAt)}</span>
      ),
    },
    {
      id: 'total',
      header: 'Amount',
      align: 'right',
      sortValue: (row) => row.total.amountMinor,
      cell: (row) => (
        <span className="text-sm font-medium tabular-nums text-foreground">
          {formatMoney(row.total)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={!row.pdfUrl}
          asChild={Boolean(row.pdfUrl)}
          title={row.pdfUrl ? undefined : 'Available once billing is connected'}
        >
          {row.pdfUrl ? (
            <a href={row.pdfUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              PDF
            </a>
          ) : (
            <span>
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              PDF
            </span>
          )}
        </Button>
      ),
    },
  ];

  return (
    <RequirePermission action="org.billing" title="invoices">
      <div className="space-y-5">
        <PageHeader
          title="Invoices"
          description="Every invoice issued to this organization."
          actions={
            <Button variant="ghost" asChild>
              <Link href="/organization/billing">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to billing
              </Link>
            </Button>
          }
        />

        {isPreview && <BillingPreviewNotice />}

        <DataTable
          columns={columns}
          rows={invoices}
          rowKey={(row) => row.id}
          isLoading={isLoading && !invoices.length}
          error={isPreview ? null : error}
          onRetry={() => void dispatch(fetchInvoices())}
          searchPlaceholder="Search invoices…"
          emptyIcon={FileText}
          emptyTitle="No invoices yet"
          emptyDescription="Invoices appear here once your organization has been billed for a period."
          caption="Invoice history"
        />
      </div>
    </RequirePermission>
  );
}
