'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchAuditLogs } from '@/features/audit/auditSlice';
import { AuditLogTable } from '@/features/audit/components/AuditLogTable';

export default function AuditLogsPage() {
  const dispatch = useAppDispatch();
  const { logs } = useAppSelector((state) => state.audit);

  useEffect(() => {
    dispatch(fetchAuditLogs());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <AuditLogTable logs={logs} />
    </div>
  );
}
