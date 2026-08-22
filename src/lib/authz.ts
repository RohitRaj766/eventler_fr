import type { Task } from '@/types';

/**
 * Eventler's authorization model.
 *
 * A permission is never a bare verb. Every question this module answers is
 * "can THIS user do THIS action to THIS thing, in THIS organization" — because
 * the same action means different reach for different roles:
 *
 *   Organization Admin  tasks.update -> any task in the organization
 *   Event Coordinator   tasks.update -> tasks in programs they work on
 *   Volunteer           tasks.update -> only tasks assigned to them
 *
 * What the server enforces, and what it does not, is documented in AUTHZ-MAP.md
 * and summarised per-action below. Everything here shapes the UI; the API is
 * the security boundary, and where it is missing a check that is recorded as a
 * gap rather than papered over.
 */

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

/**
 * The 22 permission actions the backend actually issues, verified against
 * `GET /roles/permissions`. These strings are the wire format — the product
 * vocabulary (`tasks.update`) is a presentation concern, mapped in ACTIONS.
 */
export const ACTION = {
  orgRead: 'org.read',
  orgUpdate: 'org.update',
  orgDelete: 'org.delete',
  orgBilling: 'org.billing',
  orgManageAdmins: 'org.manage_admins',
  roleManage: 'role.manage',
  programCreate: 'program.create',
  programRead: 'program.read',
  programUpdate: 'program.update',
  programDelete: 'program.delete',
  nodeCreate: 'node.create',
  nodeRead: 'node.read',
  nodeUpdate: 'node.update',
  nodeDelete: 'node.delete',
  timelineRead: 'timeline.read',
  timelineUpdate: 'timeline.update',
  timelineOverride: 'timeline.override',
  taskCreate: 'task.create',
  taskRead: 'task.read',
  taskUpdate: 'task.update',
  venueManage: 'venue.manage',
  auditRead: 'audit.read',
} as const;

export type Action = (typeof ACTION)[keyof typeof ACTION];

/** How far a granted action reaches. */
export type Reach =
  /** Everything of this kind inside the active organization. */
  | 'organization'
  /** Only records the user is personally assigned to. */
  | 'assigned'
  /** Not granted at all. */
  | 'none';

/** Whether the API rejects an unauthorized call, or only the UI hides it. */
export type Enforcement =
  /** Verified: the server returns 403/404 for an unauthorized caller. */
  | 'server'
  /** Verified gap: the server accepts the call regardless of permission. */
  | 'client-only';

export interface ActionSpec {
  action: Action;
  /** Domain grouping, for the matrix UI. */
  group: 'Organization' | 'Members & roles' | 'Billing' | 'Events' | 'Schedule' | 'Tasks' | 'Venues & resources' | 'Audit';
  /** What a person would call this, not what the endpoint is called. */
  label: string;
  description: string;
  enforcement: Enforcement;
  /** Set when the server does not check this action — names the gap. */
  gap?: string;
}

/**
 * The action catalogue.
 *
 * `enforcement` is not aspirational — each value was established by calling the
 * endpoint as an unauthorized user. Where it reads `client-only`, hiding the
 * control is the *only* thing stopping the action today.
 */
export const ACTIONS: ActionSpec[] = [
  {
    action: ACTION.orgRead,
    group: 'Organization',
    label: 'View organization',
    description: 'See organization details and resource counts.',
    enforcement: 'client-only',
    gap: 'GET /organizations/{id} has no membership check — any authenticated user can read any organization.',
  },
  {
    action: ACTION.orgUpdate,
    group: 'Organization',
    label: 'Edit organization',
    description: 'Change organization settings.',
    // There is no update endpoint at all, so nothing can be called.
    enforcement: 'server',
  },
  {
    action: ACTION.orgDelete,
    group: 'Organization',
    label: 'Delete organization',
    description: 'Permanently remove the organization.',
    enforcement: 'server',
  },
  {
    action: ACTION.orgManageAdmins,
    group: 'Members & roles',
    label: 'Manage admins',
    description: 'Grant or revoke administrator-level roles.',
    enforcement: 'server',
  },
  {
    action: ACTION.roleManage,
    group: 'Members & roles',
    label: 'Manage roles',
    description: 'Create roles and assign them to members.',
    enforcement: 'client-only',
    gap: 'POST /roles has no role.manage check — a plain Member can create roles. Role *assignment* (PUT …/role) is correctly enforced.',
  },
  {
    action: ACTION.orgBilling,
    group: 'Billing',
    label: 'Manage billing',
    description: 'View and manage subscription and payment details.',
    // No billing endpoints exist yet; nothing is callable.
    enforcement: 'server',
  },
  {
    action: ACTION.programCreate,
    group: 'Events',
    label: 'Create events',
    description: 'Start a new event program.',
    enforcement: 'server',
  },
  {
    action: ACTION.programRead,
    group: 'Events',
    label: 'View events',
    description: 'See event programs and their structure.',
    enforcement: 'server',
  },
  {
    action: ACTION.programUpdate,
    group: 'Events',
    label: 'Edit events',
    description: 'Rename an event or move it through its lifecycle.',
    enforcement: 'server',
  },
  {
    action: ACTION.programDelete,
    group: 'Events',
    label: 'Delete events',
    description: 'Permanently remove an event and everything in it.',
    enforcement: 'server',
  },
  {
    action: ACTION.nodeRead,
    group: 'Schedule',
    label: 'View schedule',
    description: 'See activities, sessions, rounds and breaks.',
    enforcement: 'server',
  },
  {
    action: ACTION.nodeCreate,
    group: 'Schedule',
    label: 'Add to schedule',
    description: 'Add activities, sessions, rounds and breaks.',
    enforcement: 'server',
  },
  {
    action: ACTION.nodeUpdate,
    group: 'Schedule',
    label: 'Edit schedule',
    description: 'Change timings, venues, structure and dependencies.',
    enforcement: 'server',
  },
  {
    action: ACTION.nodeDelete,
    group: 'Schedule',
    label: 'Delete from schedule',
    description: 'Remove a node and its whole subtree.',
    enforcement: 'server',
  },
  {
    action: ACTION.timelineRead,
    group: 'Schedule',
    label: 'View live run sheet',
    description: 'See what is running now, next, and behind.',
    enforcement: 'server',
  },
  {
    action: ACTION.timelineUpdate,
    group: 'Schedule',
    label: 'Record actual times',
    description: 'Record real start and end times, triggering propagation.',
    enforcement: 'server',
  },
  {
    action: ACTION.timelineOverride,
    group: 'Schedule',
    label: 'Override the schedule',
    description: 'Force schedule changes outside normal propagation.',
    enforcement: 'server',
  },
  {
    action: ACTION.taskRead,
    group: 'Tasks',
    label: 'View tasks',
    description: 'See operational tasks attached to the schedule.',
    enforcement: 'server',
  },
  {
    action: ACTION.taskCreate,
    group: 'Tasks',
    label: 'Create & assign tasks',
    description: 'Create tasks and assign them to people.',
    enforcement: 'server',
  },
  {
    action: ACTION.taskUpdate,
    group: 'Tasks',
    label: 'Update tasks',
    description: 'Change task status, priority and deadlines.',
    enforcement: 'client-only',
    gap: 'The server checks task.update but not task ownership — a Volunteer can update a task assigned to someone else. Assigned-only narrowing is applied in the UI only.',
  },
  {
    action: ACTION.venueManage,
    group: 'Venues & resources',
    label: 'Manage venues & resources',
    description: 'Create venues and register physical resources.',
    enforcement: 'server',
  },
  {
    action: ACTION.auditRead,
    group: 'Audit',
    label: 'View audit log',
    description: 'Read the security and administration audit trail.',
    enforcement: 'server',
  },
];

export const ACTION_SPECS: Record<string, ActionSpec> = Object.fromEntries(
  ACTIONS.map((spec) => [spec.action, spec]),
);

/** Groups in the order the matrix should present them. */
export const ACTION_GROUPS = [
  'Organization',
  'Members & roles',
  'Billing',
  'Events',
  'Schedule',
  'Tasks',
  'Venues & resources',
  'Audit',
] as const;

/* ------------------------------------------------------------------ */
/* Role taxonomy                                                       */
/* ------------------------------------------------------------------ */

/** The backend's role categories, from `GET /meta/role-permission-pools`. */
export type RoleCategory =
  | 'ORGANIZATION_SUPER_ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'COORDINATOR'
  | 'VOLUNTEER'
  | 'JURY'
  | 'MEMBER';

export interface RoleBlueprint {
  key: string;
  name: string;
  description: string;
  /** The category the backend will validate the permission set against. */
  category: RoleCategory;
  actions: Action[];
  /**
   * Set when the product intends this role to be event-scoped but the backend
   * cannot express that yet — the role is created organization-wide instead.
   */
  scopeCaveat?: string;
  /** True for roles the backend ships itself; false for ones we can create. */
  builtIn: boolean;
}

/**
 * The role taxonomy, reconciled against what the API can actually express.
 *
 * Two of the requested roles are absent from this list on purpose:
 *
 *  - **Platform Super Admin** — Eventler has no platform tier. Every role,
 *    including `ORGANIZATION_SUPER_ADMIN`, is scoped to one organization, and
 *    no platform-wide endpoint exists. Adding it is a backend change, not a
 *    frontend one, and pretending otherwise would be a lie in the UI.
 *  - **Event Admin** as a genuinely event-scoped role — see `scopeCaveat`.
 *
 * Operator, Task Manager and Viewer are not built in, but every permission
 * they need sits inside an existing category pool, so they can be created
 * through the real `POST /roles` endpoint.
 */
export const ROLE_BLUEPRINTS: RoleBlueprint[] = [
  {
    key: 'organization-admin',
    name: 'Organization Admin',
    description:
      'Runs the organization: members, roles, events, venues and the audit log.',
    category: 'ORGANIZATION_ADMIN',
    builtIn: true,
    actions: [
      ACTION.orgRead, ACTION.orgUpdate, ACTION.roleManage,
      ACTION.programCreate, ACTION.programRead, ACTION.programUpdate, ACTION.programDelete,
      ACTION.nodeCreate, ACTION.nodeRead, ACTION.nodeUpdate, ACTION.nodeDelete,
      ACTION.timelineRead, ACTION.timelineUpdate,
      ACTION.taskCreate, ACTION.taskRead, ACTION.taskUpdate,
      ACTION.venueManage, ACTION.auditRead,
    ],
  },
  {
    key: 'event-admin',
    name: 'Event Admin',
    description:
      'Full control over event structure, schedule, tasks and venues — but no access to members, roles or billing.',
    category: 'COORDINATOR',
    builtIn: false,
    scopeCaveat:
      'Intended to be scoped to one event. The API has no event-level membership, so this role currently applies to every event in the organization.',
    actions: [
      ACTION.programRead,
      ACTION.nodeCreate, ACTION.nodeRead, ACTION.nodeUpdate,
      ACTION.timelineRead, ACTION.timelineUpdate,
      ACTION.taskCreate, ACTION.taskRead, ACTION.taskUpdate,
      ACTION.venueManage,
    ],
  },
  {
    key: 'event-coordinator',
    name: 'Event Coordinator',
    description:
      'Builds and runs the schedule: structure, dependencies, timings and tasks.',
    category: 'COORDINATOR',
    builtIn: true,
    scopeCaveat:
      'Applies organization-wide until the API supports event-level membership.',
    actions: [
      ACTION.programRead,
      ACTION.nodeCreate, ACTION.nodeRead, ACTION.nodeUpdate,
      ACTION.timelineRead, ACTION.timelineUpdate,
      ACTION.taskCreate, ACTION.taskRead, ACTION.taskUpdate,
      ACTION.venueManage,
    ],
  },
  {
    key: 'operator',
    name: 'Operator',
    description:
      'Runs the event on the day: reads the run sheet and records what actually happened. Cannot restructure the event.',
    category: 'COORDINATOR',
    builtIn: false,
    scopeCaveat:
      'Applies organization-wide until the API supports event-level membership.',
    actions: [
      ACTION.programRead, ACTION.nodeRead,
      ACTION.timelineRead, ACTION.timelineUpdate,
      ACTION.taskRead, ACTION.taskUpdate,
    ],
  },
  {
    key: 'task-manager',
    name: 'Task Manager',
    description:
      'Owns the task board: creates, assigns and tracks work. Cannot change the schedule.',
    category: 'COORDINATOR',
    builtIn: false,
    actions: [
      ACTION.programRead, ACTION.nodeRead, ACTION.timelineRead,
      ACTION.taskCreate, ACTION.taskRead, ACTION.taskUpdate,
    ],
  },
  {
    key: 'volunteer',
    name: 'Volunteer',
    description:
      'Sees the schedule and their own tasks, and updates the tasks assigned to them.',
    category: 'VOLUNTEER',
    builtIn: true,
    actions: [
      ACTION.programRead, ACTION.nodeRead, ACTION.timelineRead,
      ACTION.taskRead, ACTION.taskUpdate,
    ],
  },
  {
    key: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to the schedule and tasks. Cannot change anything.',
    category: 'JURY',
    builtIn: false,
    actions: [ACTION.programRead, ACTION.nodeRead, ACTION.timelineRead, ACTION.taskRead],
  },
  {
    key: 'member',
    name: 'Member',
    description: 'Baseline membership. Can see the organization and its events, nothing more.',
    category: 'MEMBER',
    builtIn: true,
    actions: [ACTION.programRead, ACTION.nodeRead, ACTION.timelineRead, ACTION.taskRead],
  },
];

/* ------------------------------------------------------------------ */
/* Grants and reach                                                    */
/* ------------------------------------------------------------------ */

export const SUPER_ADMIN_WILDCARD = '*';

/**
 * Works out how far each granted action reaches.
 *
 * The API hands back a flat list of action strings with no scope attached, so
 * reach has to be derived. One narrowing is derivable from the backend's own
 * declared pools rather than guessed: `task.update` appears in the
 * ORGANIZATION_ADMIN, COORDINATOR and VOLUNTEER pools, and **only VOLUNTEER has
 * it without `task.create`**. So holding update-without-create identifies a
 * volunteer-shaped grant, and their task reach narrows to assigned-only.
 *
 * Everything else reaches across the active organization, because that is
 * genuinely what the server allows today.
 */
export function resolveReach(permissions: readonly string[]): Map<string, Reach> {
  const held = new Set(permissions);
  const isSuperAdmin = held.has(SUPER_ADMIN_WILDCARD);
  const reach = new Map<string, Reach>();

  const volunteerShaped =
    !isSuperAdmin && held.has(ACTION.taskUpdate) && !held.has(ACTION.taskCreate);

  for (const spec of ACTIONS) {
    if (isSuperAdmin) {
      reach.set(spec.action, 'organization');
      continue;
    }
    if (!held.has(spec.action)) {
      reach.set(spec.action, 'none');
      continue;
    }
    reach.set(
      spec.action,
      spec.action === ACTION.taskUpdate && volunteerShaped ? 'assigned' : 'organization',
    );
  }

  return reach;
}

/** Human phrasing for a reach, used wherever scope is surfaced. */
export function describeReach(reach: Reach): string {
  switch (reach) {
    case 'organization':
      return 'Everywhere in this organization';
    case 'assigned':
      return 'Only records assigned to them';
    case 'none':
      return 'Not granted';
  }
}

/** Short form for dense table cells. */
export function reachLabel(reach: Reach): string {
  switch (reach) {
    case 'organization':
      return 'Full';
    case 'assigned':
      return 'Assigned only';
    case 'none':
      return '—';
  }
}

/* ------------------------------------------------------------------ */
/* Subjects                                                            */
/* ------------------------------------------------------------------ */

/**
 * The thing an action is being asked about.
 *
 * Passing a subject is what turns "could you ever update a task?" into "can you
 * update *this* task?" — the distinction the whole model exists to make.
 */
export type Subject = { kind: 'task'; task: Pick<Task, 'assignments'> };

/**
 * Decides whether a grant covers a specific subject.
 *
 * An `assigned` reach requires the user to actually be on the record. A grant
 * with no subject supplied answers the capability question instead, which is
 * the right check for "should this button exist at all".
 */
export function coversSubject(
  reach: Reach,
  userId: string | null | undefined,
  subject?: Subject,
): boolean {
  if (reach === 'none') return false;
  if (reach === 'organization') return true;
  if (!subject) return true; // capability question, not an instance question

  if (subject.kind === 'task') {
    if (!userId) return false;
    return Boolean(subject.task.assignments?.some((a) => a.userId === userId));
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Delegation                                                          */
/* ------------------------------------------------------------------ */

/**
 * Whether a user may grant a set of actions to someone else.
 *
 * You cannot delegate what you do not hold. The server validates the category
 * pool on role creation but does not check the creator's own grants, so this
 * check keeps the UI from offering an escalation the API would accept.
 */
export function canDelegate(
  granterPermissions: readonly string[],
  requestedActions: readonly string[],
): { allowed: boolean; missing: string[] } {
  const held = new Set(granterPermissions);
  if (held.has(SUPER_ADMIN_WILDCARD)) return { allowed: true, missing: [] };
  const missing = requestedActions.filter((action) => !held.has(action));
  return { allowed: missing.length === 0, missing };
}

/** Actions this user is allowed to put on a role they create. */
export function delegatableActions(granterPermissions: readonly string[]): ActionSpec[] {
  const held = new Set(granterPermissions);
  if (held.has(SUPER_ADMIN_WILDCARD)) return ACTIONS;
  return ACTIONS.filter((spec) => held.has(spec.action));
}

/* ------------------------------------------------------------------ */
/* Reporting                                                           */
/* ------------------------------------------------------------------ */

/** Actions the server does not currently enforce — surfaced in the admin UI. */
export function unenforcedActions(): ActionSpec[] {
  return ACTIONS.filter((spec) => spec.enforcement === 'client-only');
}
