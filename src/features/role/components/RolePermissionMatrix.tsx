'use client';

import { useMemo } from 'react';
import { AlertTriangle, Check, Minus, ShieldCheck, User } from 'lucide-react';
import type { Permission, Role } from '@/types';
import { EmptyState, SkeletonRows } from '@/components/ui/states';
import {
  ACTION,
  ACTION_GROUPS,
  ACTION_SPECS,
  SUPER_ADMIN_WILDCARD,
  type ActionSpec,
  type Reach,
} from '@/lib/authz';
import { cn } from '@/lib/utils';

/**
 * Who can do what, where.
 *
 * Roles run down the side and actions across the top, because the question an
 * administrator actually asks is "who can do X?" — which a per-role list
 * buries. Two things this deliberately shows that a plain tick-grid does not:
 *
 *  - **Reach, not just permission.** A Volunteer's cell for "Update tasks"
 *    reads *Assigned* rather than a tick, because the grant genuinely does not
 *    reach the whole organization.
 *  - **Where the server does not enforce.** An action the API accepts from
 *    anyone is flagged, so nobody mistakes a hidden button for a control.
 */

interface CellState {
  reach: Reach;
  label: string;
  title: string;
}

function cellFor(role: Role, spec: ActionSpec, granted: Set<string>): CellState {
  if (granted.has(SUPER_ADMIN_WILDCARD)) {
    return { reach: 'organization', label: 'Full', title: `${role.name}: full access` };
  }
  if (!granted.has(spec.action)) {
    return { reach: 'none', label: '—', title: `${role.name} cannot ${spec.label.toLowerCase()}` };
  }
  // The one narrowing derivable from the backend's own category pools:
  // task.update without task.create is the volunteer shape.
  if (spec.action === ACTION.taskUpdate && !granted.has(ACTION.taskCreate)) {
    return {
      reach: 'assigned',
      label: 'Assigned',
      title: `${role.name}: only tasks assigned to them`,
    };
  }
  return {
    reach: 'organization',
    label: 'Full',
    title: `${role.name}: ${spec.label.toLowerCase()}, organization-wide`,
  };
}

function CellMark({ state }: { state: CellState }) {
  if (state.reach === 'none') {
    return (
      <Minus
        className="mx-auto h-3.5 w-3.5 text-muted-foreground/40"
        role="img"
        aria-label={state.title}
      />
    );
  }
  if (state.reach === 'assigned') {
    return (
      <span
        className="mx-auto inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300"
        title={state.title}
      >
        <User className="h-2.5 w-2.5" aria-hidden="true" />
        Assigned
      </span>
    );
  }
  return (
    <Check
      className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400"
      role="img"
      aria-label={state.title}
    />
  );
}

export function RolePermissionMatrix({
  roles,
  permissions,
  isLoading,
}: {
  roles: Role[];
  permissions: Permission[];
  isLoading?: boolean;
}) {
  /** Only show actions this deployment actually issues. */
  const columns = useMemo(() => {
    const issued = new Set(permissions.map((permission) => permission.action));
    const specs = Object.values(ACTION_SPECS).filter((spec) => issued.has(spec.action));
    return ACTION_GROUPS.map((group) => ({
      group,
      specs: specs.filter((spec) => spec.group === group),
    })).filter((entry) => entry.specs.length > 0);
  }, [permissions]);

  const grantsByRole = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const role of roles) {
      map.set(
        role.id,
        new Set(
          (role.rolePermissions ?? [])
            .map((rolePermission) => rolePermission.permission?.action)
            .filter((action): action is string => Boolean(action)),
        ),
      );
    }
    return map;
  }, [roles]);

  const unenforced = useMemo(
    () => columns.flatMap((entry) => entry.specs).filter((spec) => spec.enforcement === 'client-only'),
    [columns],
  );

  if (isLoading && !roles.length) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <SkeletonRows rows={5} cols={6} />
      </div>
    );
  }

  if (!roles.length) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No roles yet"
        description="Create a role to give a group of people exactly the permissions they need."
      />
    );
  }

  const flatSpecs = columns.flatMap((entry) => entry.specs);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Wide matrix scrolls inside its own container. */}
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Permissions granted to each role in this organization, with the reach of each grant
            </caption>

            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th
                  scope="col"
                  rowSpan={2}
                  className="sticky left-0 z-10 min-w-44 border-r border-border bg-muted/50 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Role
                </th>
                {columns.map((entry) => (
                  <th
                    key={entry.group}
                    scope="colgroup"
                    colSpan={entry.specs.length}
                    className="border-l border-border px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {entry.group}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-border bg-muted/50">
                {columns.map((entry) =>
                  entry.specs.map((spec, index) => (
                    <th
                      key={spec.action}
                      scope="col"
                      title={spec.description}
                      className={cn(
                        'px-2.5 py-2 text-center align-bottom text-[11px] font-medium text-muted-foreground',
                        index === 0 && 'border-l border-border',
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {spec.label}
                        {spec.enforcement === 'client-only' && (
                          <AlertTriangle
                            className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400"
                            aria-label="Not enforced by the API"
                          />
                        )}
                      </span>
                    </th>
                  )),
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {roles.map((role) => {
                const granted = grantsByRole.get(role.id) ?? new Set<string>();
                return (
                  <tr key={role.id} className="transition-colors hover:bg-muted/30">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-r border-border bg-card px-4 py-3 text-left font-normal"
                    >
                      <span className="block truncate text-sm font-medium text-foreground">
                        {role.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {role.isSystemDefault ? 'Built in' : 'Custom role'}
                      </span>
                    </th>

                    {flatSpecs.map((spec, index) => {
                      const startsGroup = columns.some((entry) => entry.specs[0]?.action === spec.action);
                      return (
                        <td
                          key={spec.action}
                          className={cn(
                            'px-2.5 py-3 text-center',
                            startsGroup && index !== 0 && 'border-l border-border',
                          )}
                        >
                          <CellMark state={cellFor(role, spec, granted)} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend — scope is the point, so it is explained, not left to a tick. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          Everywhere in this organization
        </span>
        <span className="inline-flex items-center gap-1.5">
          <User className="h-3 w-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          Only records assigned to them
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Minus className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden="true" />
          Not granted
        </span>
      </div>

      {unenforced.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-700 dark:bg-amber-950/40">
          <p className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {unenforced.length} of these permissions are not enforced by the API
          </p>
          <ul className="mt-2 space-y-1.5 text-amber-900 dark:text-amber-200">
            {unenforced.map((spec) => (
              <li key={spec.action}>
                <span className="font-medium">{spec.label}</span> — {spec.gap}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-900/80 dark:text-amber-200/80">
            Until the backend adds these checks, the matrix above describes intent rather than a
            guarantee for those columns.
          </p>
        </div>
      )}
    </div>
  );
}
