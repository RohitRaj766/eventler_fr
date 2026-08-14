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

export type NodeStatus =
  | 'SCHEDULED'
  | 'READY'
  | 'IN_PROGRESS'
  | 'DELAYED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SKIPPED';

export type DependencyType =
  | 'FINISH_TO_START'
  | 'START_TO_START'
  | 'FINISH_TO_FINISH'
  | 'START_TO_FINISH';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  role?: string;
  permissions?: string[];
  organizations?: any[];
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  user?: User;
  role?: Role;
}

export interface Role {
  id: string;
  organizationId?: string | null;
  name: string;
  description?: string;
  isSystemDefault: boolean;
  rolePermissions?: RolePermission[];
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

export type ProgramStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'PUBLISHED'
  | 'LIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Program {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  status: ProgramStatus;
  plannedStartTime: string;
  plannedEndTime: string;
  projectedStartTime: string;
  projectedEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  rootNodeId?: string;
  tree?: Node;
  createdAt: string;
}

export interface NodeDependency {
  id: string;
  predecessorId: string;
  successorId: string;
  type: DependencyType;
  lagMinutes: number;
  predecessor?: Node;
  successor?: Node;
}

export interface Node {
  id: string;
  programId: string;
  organizationId: string;
  parentId?: string | null;
  name: string;
  description?: string;
  type: NodeTypeCategory;
  customTypeName?: string;
  status: NodeStatus;
  sortOrder: number;
  version: number;
  plannedStartTime: string;
  plannedEndTime: string;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  projectedStartTime: string;
  projectedEndTime: string;
  venueId?: string | null;
  ownerUserId?: string | null;
  metadata?: Record<string, any> | null;
  venue?: Venue | null;
  children?: Node[];
  predecessors?: NodeDependency[];
  successors?: NodeDependency[];
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
}

export interface Task {
  id: string;
  nodeId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  assignments?: TaskAssignment[];
  node?: Node;
}

export interface Venue {
  id: string;
  organizationId: string;
  name: string;
  building?: string;
  capacity?: number;
  metadata?: Record<string, any>;
  resources?: Resource[];
  createdAt: string;
}

export interface Resource {
  id: string;
  organizationId: string;
  venueId?: string;
  name: string;
  type: string;
  quantity: number;
  metadata?: Record<string, any>;
  venue?: Venue;
}

export interface ScheduleChange {
  id: string;
  programId: string;
  nodeId: string;
  actorId: string;
  reason: string;
  previousState: any;
  newState: any;
  affectedNodes: string[];
  affectedUsers: string[];
  correlationId: string;
  createdAt: string;
  actor?: User;
  node?: Node;
}

export interface AuditLog {
  id: string;
  organizationId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  activeOrgId: string | null;
  activeOrg: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  pendingOtpEmail?: string;
  pendingOtpPhone?: string;
}
