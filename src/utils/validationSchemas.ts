import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string(),
  mode: z.enum(['JOIN_ORG', 'CREATE_ORG']),
  organizationCode: z.string().min(3, 'Organization code is required (e.g. AJU-2026)'),
  organizationName: z.string().optional(),
  programId: z.string().optional(),
  roleId: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.mode === 'CREATE_ORG') {
    return !!data.organizationName && data.organizationName.length >= 3;
  }
  return true;
}, {
  message: 'Institution name is required when registering a new institution',
  path: ['organizationName'],
});

export const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export const createOrgSchema = z.object({
  name: z.string().min(3, 'Organization name must be at least 3 characters'),
  code: z.string().min(3, 'Organization code must be at least 3 characters').regex(/^[A-Z0-9_-]+$/i, 'Code can only contain letters, numbers, hyphens, and underscores'),
});

export const createProgramSchema = z.object({
  name: z.string().min(3, 'Program name is required'),
  description: z.string().optional(),
  plannedStartTime: z.string().min(1, 'Planned start time is required'),
  plannedEndTime: z.string().min(1, 'Planned end time is required'),
  venueId: z.string().optional(),
}).refine((data) => new Date(data.plannedEndTime) > new Date(data.plannedStartTime), {
  message: 'End time must be after start time',
  path: ['plannedEndTime'],
});

export const createNodeSchema = z.object({
  name: z.string().min(2, 'Node name is required'),
  type: z.enum([
    'PROGRAM',
    'ACTIVITY',
    'SESSION',
    'ROUND',
    'CEREMONY',
    'COMPETITION',
    'WORKSHOP',
    'PRESENTATION',
    'BREAK',
    'TASK',
    'CUSTOM',
  ]),
  customTypeName: z.string().optional(),
  plannedStartTime: z.string().min(1, 'Planned start time is required'),
  plannedEndTime: z.string().min(1, 'Planned end time is required'),
  venueId: z.string().optional(),
  sortOrder: z.number().optional(),
}).refine((data) => new Date(data.plannedEndTime) > new Date(data.plannedStartTime), {
  message: 'End time must be after start time',
  path: ['plannedEndTime'],
});

export const recordActualTimeSchema = z.object({
  nodeId: z.string().min(1, 'Node ID is required'),
  actualStartTime: z.string().min(1, 'Actual start time is required'),
  actualEndTime: z.string().optional(),
  reason: z.string().min(3, 'Reason for actual update is required for audit trail'),
});

export const createDependencySchema = z.object({
  predecessorId: z.string().min(1, 'Predecessor node is required'),
  successorId: z.string().min(1, 'Successor node is required'),
  type: z.enum(['FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH']),
  lagMinutes: z.coerce.number().optional(),
});

export const createTaskSchema = z.object({
  nodeId: z.string().min(1, 'Target node ID is required'),
  title: z.string().min(3, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED', 'BLOCKED']),
  deadline: z.string().optional(),
  assignedUserIds: z.array(z.string()).optional(),
});

export const createVenueSchema = z.object({
  name: z.string().min(2, 'Venue name is required'),
  building: z.string().optional(),
  capacity: z.coerce.number().optional(),
});

export const createResourceSchema = z.object({
  venueId: z.string().optional(),
  name: z.string().min(2, 'Resource name is required'),
  type: z.string().min(2, 'Type is required (e.g., Audio, Projector)'),
  quantity: z.coerce.number(),
});

export const updateNodeSchema = z.object({
  name: z.string().min(2, 'Name is required').optional(),
  description: z.string().optional(),
  type: z.enum([
    'PROGRAM',
    'ACTIVITY',
    'SESSION',
    'ROUND',
    'CEREMONY',
    'COMPETITION',
    'WORKSHOP',
    'PRESENTATION',
    'BREAK',
    'TASK',
    'CUSTOM',
  ]).optional(),
  customTypeName: z.string().optional(),
  plannedStartTime: z.string().optional(),
  plannedEndTime: z.string().optional(),
  venueId: z.string().optional().nullable(),
  status: z.enum(['SCHEDULED', 'READY', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'SKIPPED', 'CANCELLED']).optional(),
  sortOrder: z.number().optional(),
  version: z.number().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;
export type RecordActualTimeInput = z.infer<typeof recordActualTimeSchema>;
export type CreateDependencyInput = z.infer<typeof createDependencySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
