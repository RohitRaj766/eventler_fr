'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Info, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { createRole, fetchRoles } from '@/features/role/roleSlice';
import { fetchOrgMetadata } from '@/features/meta/metaSlice';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/states';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermission';
import { ACTION_SPECS, ROLE_BLUEPRINTS, type RoleBlueprint } from '@/lib/authz';
import { cn } from '@/lib/utils';

/**
 * The standard role set, and whether this organization has it.
 *
 * Eventler ships four built-in roles. The product's role model also calls for
 * Event Admin, Operator, Task Manager and Viewer, which the backend has no
 * built-in equivalent for — but every permission they need sits inside an
 * existing category pool, so they can be created through the real
 * `POST /roles` endpoint rather than faked.
 *
 * Roles that cannot be honestly created are not offered. "Platform Super
 * Admin" is absent entirely: Eventler has no platform tier, every role is
 * scoped to one organization, and offering a button that produced something
 * weaker than its name would be worse than not offering it.
 */
export function RoleBlueprints() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { canGrant, isSuperAdmin, activeOrgId } = usePermissions();

  const roles = useAppSelector((state) => state.role.roles);
  const permissions = useAppSelector((state) => state.meta.permissions);
  const [creating, setCreating] = useState<string | null>(null);

  const existingNames = useMemo(
    () => new Set(roles.map((role) => role.name.trim().toLowerCase())),
    [roles],
  );

  const permissionIdByAction = useMemo(
    () => new Map(permissions.map((permission) => [permission.action, permission.id])),
    [permissions],
  );

  const handleCreate = async (blueprint: RoleBlueprint) => {
    const permissionIds = blueprint.actions
      .map((action) => permissionIdByAction.get(action))
      .filter((id): id is string => Boolean(id));

    if (permissionIds.length === 0) {
      toast.error('Cannot create this role', 'Permission metadata has not loaded yet.');
      return;
    }

    setCreating(blueprint.key);
    try {
      const result = await dispatch(
        createRole({
          name: blueprint.name,
          description: blueprint.description,
          category: blueprint.category,
          permissionIds,
        }),
      );
      if (createRole.rejected.match(result)) {
        toast.error(`Could not create ${blueprint.name}`, result.payload as string);
        return;
      }
      toast.success(`${blueprint.name} created`, 'Assign it to members from the members page.');
      void dispatch(fetchRoles(activeOrgId));
      void dispatch(fetchOrgMetadata());
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Eventler&apos;s standard role set. Roles marked <strong>Built in</strong> ship with every
        organization; the rest can be created here from permissions the backend already defines.
      </p>

      <ul className="grid gap-3 lg:grid-cols-2">
        {ROLE_BLUEPRINTS.map((blueprint) => {
          const exists = existingNames.has(blueprint.name.trim().toLowerCase());
          const delegation = canGrant(blueprint.actions);
          const busy = creating === blueprint.key;

          return (
            <li
              key={blueprint.key}
              className={cn(
                'flex flex-col rounded-xl border bg-card p-4',
                exists ? 'border-border' : 'border-dashed border-border',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                    {blueprint.name}
                    {blueprint.builtIn && (
                      <span className="rounded border border-border px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Built in
                      </span>
                    )}
                    {exists && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                        <Check className="h-2.5 w-2.5" aria-hidden="true" />
                        In this org
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{blueprint.description}</p>
                </div>
              </div>

              <ul className="mt-3 flex flex-wrap gap-1">
                {blueprint.actions.map((action) => (
                  <li
                    key={action}
                    className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground"
                    title={ACTION_SPECS[action]?.description}
                  >
                    {ACTION_SPECS[action]?.label ?? action}
                  </li>
                ))}
              </ul>

              {blueprint.scopeCaveat && (
                <p className="mt-3 flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-2 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
                  {blueprint.scopeCaveat}
                </p>
              )}

              {!exists && (
                <div className="mt-auto pt-3">
                  {!delegation.allowed && !isSuperAdmin ? (
                    <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <Info className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
                      You can&apos;t create this — it includes permissions you don&apos;t hold
                      ({delegation.missing.length}).
                    </p>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={busy}
                      onClick={() => void handleCreate(blueprint)}
                    >
                      {busy ? <Spinner /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                      {busy ? 'Creating…' : `Create ${blueprint.name}`}
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
        <p className="font-medium text-foreground">Not available: Platform Super Admin</p>
        <p className="mt-1 text-muted-foreground">
          Eventler has no platform tier — every role, including Organization Super Admin, is scoped
          to a single organization, and no platform-wide endpoint exists. Adding one is a backend
          change; it isn&apos;t offered here because the role it created would not do what its name
          promises.
        </p>
      </div>
    </div>
  );
}
