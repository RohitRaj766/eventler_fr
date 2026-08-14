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
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
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
  description: z.string().optional(),
  type: z.enum([
    'PROGRAM', 'ACTIVITY', 'SESSION', 'ROUND', 'CEREMONY',
    'COMPETITION', 'BREAK', 'WORKSHOP', 'PRESENTATION', 'TASK', 'CUSTOM'
  ]),
  customTypeName: z.string().optional(),
  plannedStartTime: z.string().min(1, 'Start time is required'),
  plannedEndTime: z.string().min(1, 'End time is required'),
  venueId: z.string().optional(),
}).refine((data) => new Date(data.plannedEndTime) > new Date(data.plannedStartTime), {
  message: 'End time must be after start time',
  path: ['plannedEndTime'],
});

export const recordActualTimeSchema = z.object({
  nodeId: z.string().min(1, 'Node is required'),
  actualStartTime: z.string().optional(),
  actualEndTime: z.string().optional(),
  reason: z.string().min(3, 'Please specify a reason for this schedule update'),
});

export const createDependencySchema = z.object({
  predecessorId: z.string().min(1, 'Predecessor node is required'),
  successorId: z.string().min(1, 'Successor node is required'),
  type: z.enum(['FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH']),
  lagMinutes: z.preprocess((val) => Number(val) || 0, z.number()),
}).refine((data) => data.predecessorId !== data.successorId, {
  message: 'A node cannot depend on itself',
  path: ['successorId'],
});

export const createTaskSchema = z.object({
  nodeId: z.string().min(1, 'Node selection is required'),
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED', 'BLOCKED', 'CANCELLED']),
  deadline: z.string().optional(),
  assignedUserIds: z.array(z.string()).optional(),
});

export const createVenueSchema = z.object({
  name: z.string().min(2, 'Venue name is required'),
  building: z.string().optional(),
  capacity: z.preprocess((val) => (val === '' || val === undefined ? undefined : Number(val)), z.number().optional()),
});

export const createResourceSchema = z.object({
  venueId: z.string().optional(),
  name: z.string().min(2, 'Resource name is required'),
  type: z.string().min(2, 'Type is required (e.g., Audio, Projector)'),
  quantity: z.preprocess((val) => Number(val) || 1, z.number()),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type RecordActualTimeInput = z.infer<typeof recordActualTimeSchema>;
export type CreateDependencyInput = z.infer<typeof createDependencySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
