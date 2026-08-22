'use client';

import type { ReactNode } from 'react';
import { usePermissions, type PermissionAction } from '@/hooks/usePermission';
import type { Subject } from '@/lib/authz';

interface CanProps {
  /** Passes when the user holds any one of these actions. */
  action?: PermissionAction | PermissionAction[];
  /** Passes only when the user holds every one of these actions. */
  all?: PermissionAction[];
  /**
   * The record being acted on. Without it the gate asks whether the control
   * should exist at all; with it, whether it applies to *this* record — which
   * is what keeps a Volunteer's task controls on their own tasks only.
   */
  subject?: Subject;
  children: ReactNode;
  /** Rendered instead of `children` when the check fails. */
  fallback?: ReactNode;
}

/**
 * Renders `children` only when the active organization grants the permission
 * at a reach that covers the subject.
 *
 * Presentation only — the backend is the security boundary. Use it to keep the
 * UI honest about what a user can actually do, not to protect anything.
 */
export function Can({ action, all, subject, children, fallback = null }: CanProps) {
  const { can, canAll } = usePermissions();
  const allowed = all ? canAll(all, subject) : can(action, subject);
  return <>{allowed ? children : fallback}</>;
}
