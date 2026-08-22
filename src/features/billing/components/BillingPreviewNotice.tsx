'use client';

import { FlaskConical } from 'lucide-react';

/**
 * Persistent, non-dismissible notice on every billing screen.
 *
 * Financial UI is the one place where scaffolding must never be mistakable for
 * the real thing. This states plainly that nothing on the page is a real
 * charge, invoice or card, and that no action taken here bills anyone.
 */
export function BillingPreviewNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/40"
    >
      <FlaskConical
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300"
        aria-hidden="true"
      />
      <div className="min-w-0 text-sm text-amber-900 dark:text-amber-200">
        <p className="font-semibold">Preview — billing is not connected yet</p>
        <p className="mt-1 leading-relaxed">
          The backend has no billing endpoints, so the plan, amounts, invoices and card shown here
          are sample values for layout only. Nothing on this page is a real charge or record, no
          money moves, and no action here bills anyone.
        </p>
      </div>
    </div>
  );
}
