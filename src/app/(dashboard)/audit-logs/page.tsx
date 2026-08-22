import { redirect } from 'next/navigation';

/** Legacy path — the audit screen now lives at /audit. */
export default function LegacyAuditLogsPage() {
  redirect('/audit');
}
