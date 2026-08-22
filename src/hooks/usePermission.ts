'use client';

import { useCallback, useMemo } from 'react';
import { useAppSelector } from '@/app/hooks';
import type { Task } from '@/types';
import {
  ACTION,
  canDelegate,
  coversSubject,
  delegatableActions,
  describeReach,
  resolveReach,
  SUPER_ADMIN_WILDCARD,
  type Action,
  type Reach,
  type Subject,
} from '@/lib/authz';

/**
 * Permission actions, re-exported so call sites keep autocomplete and a typo
 * surfaces at compile time rather than as a silently hidden button.
 */
export const PERMISSIONS = ACTION;

export type PermissionAction = Action | (string & {});

/**
 * Answers "can this person do this, to this thing, here?"
 *
 * Three things make this more than a set-membership test:
 *
 *  1. **The active organization is the boundary.** `permissions` always
 *     describes the active org only — switching orgs replaces it wholesale, so
 *     a grant in one tenant can never answer a question about another.
 *  2. **Reach is resolved, not assumed.** A Volunteer's `task.update` reaches
 *     only tasks assigned to them; an admin's reaches the whole organization.
 *     See `resolveReach` for how that is derived from the API's own data.
 *  3. **Subjects narrow the answer.** `can('task.update')` asks whether the
 *     control should exist; `can('task.update', { kind: 'task', task })` asks
 *     whether it should work on *that* task.
 *
 * This shapes the UI. The API is the security boundary — and where the API is
 * missing a check, `lib/authz.ts` records it as a gap rather than letting the
 * hidden button stand in for enforcement.
 */
export function usePermissions() {
  const permissions = useAppSelector((state) => state.auth.permissions);
  const activeOrgId = useAppSelector((state) => state.auth.activeOrgId);
  const organizations = useAppSelector((state) => state.auth.organizations);
  const userId = useAppSelector((state) => state.auth.user?.id ?? null);

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);
  const isSuperAdmin = permissionSet.has(SUPER_ADMIN_WILDCARD);
  const reachByAction = useMemo(() => resolveReach(permissions), [permissions]);

  /** How far a granted action reaches, or 'none' if it isn't granted. */
  const reachOf = useCallback(
    (action: PermissionAction): Reach => reachByAction.get(action) ?? (isSuperAdmin ? 'organization' : 'none'),
    [reachByAction, isSuperAdmin],
  );

  /**
   * Passes when the user holds any one of the listed actions. With a subject,
   * the grant must also cover that specific record.
   */
  const can = useCallback(
    (action?: PermissionAction | PermissionAction[], subject?: Subject) => {
      if (!action) return true;
      if (isSuperAdmin) return true;

      const actions = Array.isArray(action) ? action : [action];
      return actions.some((item) => {
        // An action outside the catalogue falls back to plain set membership,
        // so an action the backend adds later still works before we model it.
        const reach = reachByAction.get(item) ?? (permissionSet.has(item) ? 'organization' : 'none');
        return coversSubject(reach, userId, subject);
      });
    },
    [reachByAction, permissionSet, isSuperAdmin, userId],
  );

  /** Requires *every* listed action — for screens that need a combination. */
  const canAll = useCallback(
    (actions: PermissionAction[], subject?: Subject) => {
      if (isSuperAdmin) return true;
      return actions.every((action) => {
        const reach = reachByAction.get(action) ?? (permissionSet.has(action) ? 'organization' : 'none');
        return coversSubject(reach, userId, subject);
      });
    },
    [reachByAction, permissionSet, isSuperAdmin, userId],
  );

  /** Ready-to-render scope wording, e.g. "Only records assigned to them". */
  const scopeOf = useCallback(
    (action: PermissionAction) => describeReach(reachOf(action)),
    [reachOf],
  );

  /**
   * Whether this user may grant these actions to someone else. You cannot
   * delegate what you do not hold — the server checks the role's category pool
   * but not the granter's own permissions.
   */
  const canGrant = useCallback(
    (actions: readonly string[]) => canDelegate(permissions, actions),
    [permissions],
  );

  /** The actions this user is entitled to put on a role they create. */
  const grantableActions = useMemo(() => delegatableActions(permissions), [permissions]);

  const activeRoleName = useMemo(
    () => organizations.find((org) => org.id === activeOrgId)?.role ?? null,
    [organizations, activeOrgId],
  );

  return {
    can,
    canAll,
    reachOf,
    scopeOf,
    canGrant,
    grantableActions,
    isSuperAdmin,
    permissions,
    activeRoleName,
    activeOrgId,
    userId,
  };
}

/** Single-action convenience: `const canDelete = usePermission('node.delete')`. */
export function usePermission(
  action?: PermissionAction | PermissionAction[],
  subject?: Subject,
): boolean {
  const { can } = usePermissions();
  return can(action, subject);
}

/**
 * Whether this specific task may be edited by the current user.
 *
 * Broken out because it is the one place the product genuinely needs
 * per-record scope today: a Volunteer holds `task.update` but must only reach
 * tasks assigned to them.
 */
export function useCanEditTask(task: Pick<Task, 'assignments'>): boolean {
  const { can } = usePermissions();
  return can(ACTION.taskUpdate, { kind: 'task', task });
}
