'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchRoles, fetchPermissions, createRole } from '@/features/role/roleSlice';
import { RolePermissionMatrix } from '@/features/role/components/RolePermissionMatrix';
import { CreateRoleModal } from '@/features/role/components/CreateRoleModal';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Plus } from 'lucide-react';

export default function RolesPage() {
  const dispatch = useAppDispatch();
  const { roles, permissions } = useAppSelector((state) => state.role);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
  }, [dispatch]);

  const handleCreateRole = async (data: { name: string; description?: string; category?: string; permissionIds: string[] }) => {
    await dispatch(createRole(data));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            Institutional RBAC Matrix
          </h2>
          <p className="text-xs text-slate-500 font-medium">Manage scope permissions and multi-role permission unions.</p>
        </div>

        <Button onClick={() => setRoleModalOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Create Custom Role
        </Button>
      </div>

      <RolePermissionMatrix roles={roles} permissions={permissions} />

      <CreateRoleModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        permissions={permissions}
        onSubmit={handleCreateRole}
      />
    </div>
  );
}
