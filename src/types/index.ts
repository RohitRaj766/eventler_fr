/**
 * Eventler API models.
 *
 * Every shape here was verified against the live backend
 * (https://eventler.onrender.com/api/v1), not only the Swagger page —
 * the published spec is out of date in several places. Where the two
 * disagree the live contract wins and the difference is noted inline.
 */

/* ------------------------------------------------------------------ */
/* Envelope                                                            */
/* ------------------------------------------------------------------ */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: ValidationIssue[] | string;
  timestamp: string;
}

/** Backend validation failures come back as raw Zod issues. */
export interface ValidationIssue {
  code: string;
  message: string;
  path: (string | number)[];
  expected?: string;
  received?: string;
  options?: string[];
  minimum?: number;
  maximum?: number;
  validation?: string;
}

/** Normalised error every screen consumes — see `lib/apiError.ts`. */
export interface NormalizedApiError {
  /** Human-readable sentence safe to render. */
  message: string;
  /** HTTP status, 0 for network/abort failures. */
  status: number;
  /** Machine-friendly bucket for branching. */
  kind:
    | 'validation'
    | 'unauthorized'
    | 'forbidden'
    | 'notfound'
    | 'conflict'
    | 'ratelimit'
    | 'server'
    | 'network'
    | 'unknown';
  /** Field name -> message, ready to feed into react-hook-form. */
  fieldErrors: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/* Enums (values mirror GET /meta/enums)                               */
/* ------------------------------------------------------------------ */

export type ProgramStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'PUBLISHED'
  | 'LIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type NodeStatus =
  | 'SCHEDULED'
  | 'READY'
  | 'IN_PROGRESS'
  | 'DELAYED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SKIPPED';

export type NodeTypeCategory =
  | 'PROGRAM'
  | 'ACTIVITY'
  | 'SESSION'
  | 'ROUND'
  | 'CEREMONY'
  | 'COMPETITION'
  | 'BREAK'
  | 'WORKSHOP'
  | 'PRESENTATION'
  | 'TASK'
  | 'CUSTOM';

export type DependencyType =
  | 'FINISH_TO_START'
  | 'START_TO_START'
  | 'FINISH_TO_FINISH'
  | 'START_TO_FINISH';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'READY'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'CANCELLED';

export type RoleCategory =
  | 'ORGANIZATION_SUPER_ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'COORDINATOR'
  | 'VOLUNTEER'
  | 'JURY'
  | 'MEMBER';

export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

/** `{ value, label }` pairs as returned by the metadata endpoints. */
export interface EnumOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SystemEnums {
  programStatus: EnumOption<ProgramStatus>[];
  nodeStatus: EnumOption<NodeStatus>[];
  nodeTypeCategory: EnumOption<NodeTypeCategory>[];
  dependencyType: EnumOption<DependencyType>[];
  taskPriority: EnumOption<TaskPriority>[];
  taskStatus: EnumOption<TaskStatus>[];
  permissionScopeType: EnumOption[];
  notificationChannel: EnumOption[];
  notificationSeverity: EnumOption<NotificationSeverity>[];
}

export interface NodeTypeMeta {
  type: NodeTypeCategory;
  label: string;
}

export interface RolePermissionPools {
  categories: {
    category: RoleCategory;
    label: string;
    allowedPermissions: string[];
  }[];
  pools: Record<string, string[]>;
}

export interface SystemRoleMeta {
  name: string;
  description: string;
  isSystemDefault: boolean;
}

export interface OrgRoleMeta {
  id: string;
  name: string;
  description?: string;
  isSystemDefault: boolean;
  _count?: { rolePermissions: number; orgMembers: number };
}

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  /**
   * NOTE: /auth/me does NOT return the verification flags today — they only
   * appear on nested `user` objects from some list endpoints. Treat as unknown
   * rather than false when absent.
   */
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** An organization as it appears in the user's membership list. */
export interface OrganizationMembershipSummary {
  id: string;
  name: string;
  code: string;
  /** Role display name inside that organization. */
  role: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    members: number;
    programs: number;
    venues: number;
  };
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  role?: Pick<Role, 'id' | 'name' | 'description'>;
}

export interface Permission {
  id: string;
  action: string;
  description: string;
  scopeType: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission?: Permission;
}

export interface Role {
  id: string;
  organizationId?: string | null;
  name: string;
  description?: string | null;
  isSystemDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
  rolePermissions?: RolePermission[];
}

/* ------------------------------------------------------------------ */
/* Auth payloads                                                       */
/* ------------------------------------------------------------------ */

export interface AuthSessionPayload {
  user: User;
  organizations: OrganizationMembershipSummary[];
  permissions: string[];
  accessToken: string;
  refreshToken: string;
  activeOrganizationId?: string | null;
}

export interface CurrentUserPayload {
  user: User;
  organizations: OrganizationMembershipSummary[];
  permissions: string[];
  activeOrganizationId?: string | null;
}

export interface SwitchOrgPayload {
  activeOrganization: OrganizationMembershipSummary;
  permissions: string[];
  accessToken: string;
}

export interface RefreshPayload {
  accessToken: string;
  refreshToken: string;
}

/* ------------------------------------------------------------------ */
/* Programs & the event tree                                           */
/* ------------------------------------------------------------------ */

export interface Program {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  status: ProgramStatus;
  version: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * A generic tree node. The backend uses `name`/`type` — Swagger's
 * `title`/`typeCategory` are wrong and rejected by the validator.
 */
export interface EventNode {
  id: string;
  programId: string;
  organizationId: string;
  parentId?: string | null;
  name: string;
  description?: string | null;
  type: NodeTypeCategory;
  customTypeName?: string | null;
  status: NodeStatus;
  sortOrder: number;
  /** Optimistic-lock counter; PATCH /nodes/:id requires it. */
  version: number;
  plannedStartTime: string;
  plannedEndTime: string;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  projectedStartTime: string;
  projectedEndTime: string;
  venueId?: string | null;
  ownerUserId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;

  venue?: Venue | null;
  tasks?: Task[];
  predecessors?: NodeDependency[];
  successors?: NodeDependency[];
  children?: EventNode[];
}

/** Backwards-compatible alias — earlier code imported this as `Node`. */
export type { EventNode as Node };

/** GET /programs/:id — the program plus its flat and nested node lists. */
export interface ProgramTree extends Program {
  nodes: EventNode[];
  tree: EventNode[];
}

export interface NodeDependency {
  id: string;
  predecessorId: string;
  successorId: string;
  type: DependencyType;
  lagMinutes: number;
  createdAt?: string;
  predecessor?: EventNode;
  successor?: EventNode;
}

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  assignedAt?: string;
  user?: User;
}

export interface Task {
  id: string;
  nodeId: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string | null;
  /** Optimistic-lock counter; send as `version` on PATCH. */
  version: number;
  createdAt: string;
  updatedAt: string;
  assignments?: TaskAssignment[];
  node?: Pick<EventNode, 'id' | 'name' | 'type' | 'programId'>;
}

/* ------------------------------------------------------------------ */
/* Venues & physical resources                                         */
/* ------------------------------------------------------------------ */

export interface Venue {
  id: string;
  organizationId: string;
  name: string;
  building?: string | null;
  capacity?: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  resources?: PhysicalResource[];
  nodes?: Pick<EventNode, 'id' | 'name'>[];
  _count?: { nodes: number };
}

export interface PhysicalResource {
  id: string;
  organizationId: string;
  venueId?: string | null;
  name: string;
  type: string;
  quantity: number;
  metadata?: Record<string, unknown> | null;
  venue?: Pick<Venue, 'id' | 'name'> | null;
}

/** Legacy alias. */
export type Resource = PhysicalResource;

/* ------------------------------------------------------------------ */
/* Live engine                                                         */
/* ------------------------------------------------------------------ */

export interface ScheduleChangeState {
  status?: NodeStatus;
  delayMinutes?: number;
  projectedStartTime?: string;
  projectedEndTime?: string;
  [key: string]: unknown;
}

export interface ScheduleChange {
  id: string;
  programId: string;
  nodeId: string;
  actorId: string;
  reason: string;
  previousState: ScheduleChangeState;
  newState: ScheduleChangeState;
  affectedNodes: string[];
  affectedUsers: string[];
  correlationId: string;
  createdAt: string;
  actor?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  node?: Pick<EventNode, 'id' | 'name' | 'type'>;
}

export interface LivePropagationResult {
  targetNode: EventNode;
  affectedNodes: EventNode[];
  delayMinutes: number;
  changeRecord: ScheduleChange;
}

/* ------------------------------------------------------------------ */
/* Notifications & audit                                               */
/* ------------------------------------------------------------------ */

export interface AppNotification {
  id: string;
  userId?: string;
  title?: string;
  message?: string;
  body?: string;
  severity?: NotificationSeverity;
  channel?: string;
  isRead?: boolean;
  readAt?: string | null;
  correlationId?: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId?: string | null;
  userId?: string | null;
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  resource?: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  actor?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
}

/* ------------------------------------------------------------------ */
/* Organization invitations                                            */
/* ------------------------------------------------------------------ */

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  /** Set when the invitation is scoped to one program rather than the org. */
  programId?: string | null;
  email: string;
  roleId: string;
  invitedById: string;
  /** Single-use token carried in the invite link. */
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  role?: Role;
  program?: Pick<Program, 'id' | 'name'> | null;
  invitedBy?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
}

/**
 * Result of `POST /organizations/invitations`.
 *
 * The backend branches on whether the email already has an Eventler account:
 *  - `isExistingUser: true`  — the person is added to the roster immediately
 *    and the invitation is recorded as already ACCEPTED.
 *  - `isExistingUser: false` — a PENDING invitation is created for them.
 */
export interface InvitationResult {
  isExistingUser: boolean;
  user?: User;
  invitation: OrganizationInvitation;
}
