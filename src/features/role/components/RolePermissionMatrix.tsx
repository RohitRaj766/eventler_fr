'use client';

import { Role, Permission } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldCheck, Check, Lock } from 'lucide-react';

interface RolePermissionMatrixProps {
  roles: Role[];
  permissions: Permission[];
}

export function RolePermissionMatrix({ roles, permissions }: RolePermissionMatrixProps) {
  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-400" />
          Fine-Grained RBAC & Multi-Role Permission Union Matrix
        </CardTitle>
        <CardDescription>
          Authorization map computed as the union across all active roles for the organization context.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Permission Action</TableHead>
              <TableHead className="w-[120px]">Scope Type</TableHead>
              {roles.map((role) => (
                <TableHead key={role.id} className="text-center font-bold">
                  <div className="flex flex-col items-center gap-1">
                    <span>{role.name}</span>
                    {role.isSystemDefault ? (
                      <Badge variant="secondary" className="text-[9px]">System</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px]">Custom</Badge>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((perm) => (
              <TableRow key={perm.id}>
                <TableCell className="font-mono text-xs font-semibold text-foreground">
                  {perm.action}
                  <span className="block text-[11px] font-normal text-muted-foreground">
                    {perm.description}
                  </span>
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {perm.scopeType}
                  </Badge>
                </TableCell>

                {roles.map((role) => {
                  const hasPermission = role.rolePermissions?.some(
                    (rp) => rp.permissionId === perm.id || rp.permission?.action === perm.action
                  );

                  return (
                    <TableCell key={role.id} className="text-center">
                      {hasPermission ? (
                        <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/30">
                          <Lock className="h-3 w-3" />
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
