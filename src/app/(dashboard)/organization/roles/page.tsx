'use client';

import { useEffect, useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { createRole, fetchPermissions, fetchRoles } from '@/features/role/roleSlice';
import { fetchOrgMetadata } from '@/features/meta/metaSlice';
import { RolePermissionMatrix } from '@/features/role/components/RolePermissionMatrix';
import { RoleBlueprints } from '@/features/role/components/RoleBlueprints';
import { CreateRoleModal } from '@/features/role/components/CreateRoleModal';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { Can } from '@/components/auth/Can';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/states';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import type { CreateRoleInput } from '@/utils/validationSchemas';

export default function RolesPage() {
  const dispatch = useAppDispatch();
  const toast = useToast();

  const { roles, permissions, isLoading, error } = useAppSelector((state) => state.role);
  const pools = useAppSelector((state) => state.meta.permissionPools);
  const activeOrgId = useAppSelector((state) => state.auth.activeOrgId);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    void dispatch(fetchRoles(activeOrgId));
    void dispatch(fetchPermissions());
  }, [dispatch, activeOrgId]);

  const handleCreate = async (values: CreateRoleInput) => {
    const result = await dispatch(
      createRole({
        name: values.name,
        description: values.description || undefined,
        category: values.category,
        permissionIds: values.permissionIds,
      }),
    );
    if (createRole.rejected.match(result)) {
      toast.error('Could not create the role', result.payload as string);
      return;
    }
    setCreateOpen(false);
    toast.success('Role created', `${values.name} can now be assigned to members.`);
    // The member-role picker reads from org metadata.
    void dispatch(fetchOrgMetadata());
  };

  return (
    <RequirePermission action="role.manage" title="roles and permissions">
      <div className="space-y-5">
        <PageHeader
          title="Roles & permissions"
          description="What each role in this organization is allowed to do."
          actions={
            <Can action="role.manage">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                New role
              </Button>
            </Can>
          }
        />

        {error ? (
          <ErrorState message={error} onRetry={() => void dispatch(fetchRoles(activeOrgId))} />
        ) : (
          <Tabs defaultValue="matrix">
            <TabsList>
              <TabsTrigger value="matrix">Permission matrix</TabsTrigger>
              <TabsTrigger value="standard">Standard roles</TabsTrigger>
              <TabsTrigger value="categories">Category pools</TabsTrigger>
            </TabsList>

            <TabsContent value="matrix" className="mt-4">
              <RolePermissionMatrix
                roles={roles}
                permissions={permissions}
                isLoading={isLoading}
              />
              <p className="mt-3 text-xs text-muted-foreground">
                Assign roles to people on the{' '}
                <a href="/organization/members" className="font-medium text-primary hover:underline">
                  members page
                </a>
                . Roles cannot be edited or deleted — this server exposes no endpoint for either.
              </p>
            </TabsContent>

            <TabsContent value="standard" className="mt-4">
              <RoleBlueprints />
            </TabsContent>

            <TabsContent value="categories" className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Every custom role belongs to a category, and a category caps which permissions the
                role may hold. These pools come from the backend, so they always match what it
                will accept.
              </p>

              <ul className="grid gap-3 sm:grid-cols-2">
                {(pools?.categories ?? []).map((category) => (
                  <li
                    key={category.category}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">{category.label}</h3>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {category.category}
                        </p>
                      </div>
                    </div>

                    <ul className="mt-3 flex flex-wrap gap-1">
                      {category.allowedPermissions.map((action) => (
                        <li
                          key={action}
                          className="rounded border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                        >
                          {action === '*' ? 'all permissions' : action}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        )}

        <CreateRoleModal open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} />
      </div>
    </RequirePermission>
  );
}
