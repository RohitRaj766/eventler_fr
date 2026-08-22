# Eventler authorization — current state

Everything below was verified by calling the running API, not read from Swagger.
Re-run: `scratchpad/authz-probe.mjs`, `scratchpad/authz-retest.mjs`.

## 1. The model the backend actually implements

Authorization is `user × organization × role → flat permission list`.

- **Membership** is organization-level only: `OrganizationMember { organizationId, userId, roleId }`.
- **Tokens are org-scoped**: `POST /auth/switch-org` mints an access token carrying
  `organizationId`; `x-organization-id` names the tenant on each request.
- **Effective permissions** arrive as a flat `string[]` from `/auth/me` and `/auth/switch-org`.
  `*` is the super-admin wildcard.
- **22 permission actions** exist, each carrying a `scopeType`
  (`ORGANIZATION | PROGRAM | ACTIVITY | SESSION | TASK | ASSIGNED_RESOURCE`).
  **`scopeType` is metadata only — it is never evaluated.** A user with `task.update`
  can update any task in the org, including one assigned to someone else.
- **6 role categories** with declared permission pools
  (`GET /meta/role-permission-pools`), enforced on role creation.

## 2. Verified SECURE (server-side, confirmed by probe)

| Check | Result |
|---|---|
| Non-member reads another org's program / node / task | `403 Missing required action` |
| Non-member mutates another org's node / task | `403` |
| Spoofing `x-organization-id` to a foreign org | Rejected — permissions are evaluated **in the header's org**, and a non-member holds none there |
| Member promotes self to Super Admin | `403 Missing required action 'role.manage'` |
| Member invites someone as Super Admin | `403 Missing required action 'org.manage_admins'` |
| Assigning an out-of-pool permission to a role category | `400 Permission 'org.billing' is restricted…` |
| Node / task optimistic locking | `409` on stale version |

Header spoofing is **not** a bypass: the tenant header selects which membership to
evaluate against, it does not grant one.

## 3. Verified GAPS (server-side, confirmed by probe)

| # | Gap | Evidence |
|---|---|---|
| G1 | `GET /organizations/members` performs **no membership check** | A non-member listed another org's roster including member emails |
| G2 | `GET /organizations/{id}` performs **no membership check** | Any authenticated user reads any org's name, code and resource counts |
| G3 | `POST /roles` performs **no `role.manage` check** | A plain **Member** created a role (pool validation ran; the permission check did not) |
| G4 | `GET /roles` has **no tenant filter** | Returned roles from **9 distinct organizations** |
| G5 | `POST /tasks` returns `assignments[].user.passwordHash` | bcrypt hash of a real password |
| G6 | `POST /organizations/invitations` returns `user.passwordHash` | same, for an existing invitee |
| G7 | `POST /organizations` performs **no permission check** | A plain Member created an org and was granted Super Admin of it |

## 4. Capability the product requires and the backend does NOT have

**Event-level membership does not exist.**

- No `/programs/{id}/members`, `/events/{id}/members` or equivalent (all 404).
- `POST /organizations/invitations` accepts and stores `programId`, but a
  program-scoped invitation produces **no change** in the invitee's effective
  permissions — verified.
- `/auth/me` returns one flat org-level permission array with no per-event surface.

Consequence: **"Event Admin" and "Event Coordinator" cannot be genuinely
event-scoped today.** Any role granting `node.update` grants it across every
program in the organization.

## 5. Requested taxonomy vs. what is implementable now

| Requested role | Backend support | Status |
|---|---|---|
| Platform Super Admin | none — no platform tier exists; `ORGANIZATION_SUPER_ADMIN` is org-scoped | **Not implementable** |
| Organization Admin | `ORGANIZATION_ADMIN` category | Maps directly |
| Event Admin | no event scope | **Org-scoped approximation only** |
| Event Coordinator | `COORDINATOR` category | Org-scoped approximation |
| Operator | no built-in | Creatable as a custom role (COORDINATOR pool) |
| Task Manager | no built-in | Creatable as a custom role (COORDINATOR pool) |
| Volunteer | `VOLUNTEER` category | Maps directly |
| Member | `MEMBER` category | Maps directly |
| Viewer | `JURY` category is read-only | Maps to JURY |

## 6. Scope narrowing derivable from the backend's own pools

`task.update` appears in `ORGANIZATION_ADMIN`, `COORDINATOR` and `VOLUNTEER`.
Only `VOLUNTEER` has `task.update` **without** `task.create`. That makes
"holds `task.update`, lacks `task.create`" a sound, data-derived signal for
assigned-only task scope — not a guess.

The server does not enforce this narrowing (see §1), so the frontend applies it
for UX and it is listed in §3 as required backend work.
