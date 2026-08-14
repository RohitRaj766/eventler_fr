'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchRoles, fetchPermissions } from '@/features/role/roleSlice';
import { RolePermissionMatrix } from '@/features/role/components/RolePermissionMatrix';

export default function RolesPage() {
  const dispatch = useAppDispatch();
  const { roles, permissions } = useAppSelector((state) => state.role);

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <RolePermissionMatrix roles={roles} permissions={permissions} />
    </div>
  );
}
