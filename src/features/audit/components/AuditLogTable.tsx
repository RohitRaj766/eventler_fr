'use client';

import { AuditLog } from '@/types';
import { formatDate } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, Shield, User as UserIcon } from 'lucide-react';

interface AuditLogTableProps {
  logs: AuditLog[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-indigo-400" />
          Append-Only System Audit Stream
        </CardTitle>
        <CardDescription>
          Immutable activity stream capturing security events, live schedule adjustments, and permission changes.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 overflow-x-auto">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Shield className="mx-auto h-8 w-8 opacity-40 mb-2" />
            <p className="text-sm font-medium">No audit entries found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor User</TableHead>
                <TableHead className="text-right">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {log.entityType} ({log.entityId.slice(0, 8)})
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{log.user ? `${log.user.firstName} ${log.user.lastName}` : log.userId || 'System'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {log.ipAddress || '127.0.0.1'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
