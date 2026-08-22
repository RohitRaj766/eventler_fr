'use client';

import { useAppSelector } from '@/app/hooks';

/**
 * Who may create an organization.
 *
 * Belonging to an institution and founding one are different things: once you
 * are a member of an organization you work inside it — you don't spin up new
 * ones. So creation is offered only during first-run onboarding, to a user who
 * belongs to nothing yet.
 *
 * The rule lives here alone so it can be changed in one place. To let existing
 * owners found additional organizations instead, swap the body for something
 * like:
 *
 *   const { isSuperAdmin } = usePermissions();
 *   return organizations.length === 0 || isSuperAdmin;
 *
 * IMPORTANT: this shapes the UI only, and is not a security boundary.
 * `POST /api/v1/organizations` has no permission check server-side — any
 * authenticated user, including a plain Member, can call it directly and is
 * made Super Admin of whatever they create. Enforcing this properly requires a
 * backend change.
 */
export function useCanCreateOrganization(): boolean {
  const organizations = useAppSelector((state) => state.auth.organizations);
  return organizations.length === 0;
}
