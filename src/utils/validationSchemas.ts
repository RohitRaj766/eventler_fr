import { z } from 'zod';

/**
 * Client-side schemas mirror the backend's own Zod rules (probed against the
 * live validator) so users see the same constraints twice, not two different
 * sets of rules.
 */

const PASSWORD_MIN = 8; // enforced server-side on register/reset/change

const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email address');
const password = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`);

/** E.164-ish: optional +, 7-15 digits. */
const phoneNumber = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{6,14}$/, 'Enter a valid phone number, e.g. +14155550123');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    email,
    phoneNumber: phoneNumber.optional().or(z.literal('')),
    password,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    /** Optional institution slug — joins an existing organization on signup. */
    orgCode: z.string().trim().optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, 'Reset token is required'),
    newPassword: password,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: password,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Choose a password different from your current one',
    path: ['newPassword'],
  });

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export const createOrgSchema = z.object({
  name: z.string().trim().min(2, 'Organization name is required'),
  code: z
    .string()
    .trim()
    .min(3, 'Code must be at least 3 characters')
    // Server-enforced ceiling — verified against the live validator.
    .max(20, 'Code must be 20 characters or fewer')
    .regex(
      /^[a-z0-9][a-z0-9-]*$/i,
      'Use letters, numbers and hyphens only — members type this to join',
    ),
  logoUrl: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')),
});

export const createProgramSchema = z
  .object({
    name: z.string().trim().min(3, 'Program name is required'),
    description: z.string().trim().max(500, 'Keep the description under 500 characters').optional().or(z.literal('')),
    plannedStartTime: z.string().min(1, 'Start time is required'),
    plannedEndTime: z.string().min(1, 'End time is required'),
  })
  .refine((data) => new Date(data.plannedEndTime) > new Date(data.plannedStartTime), {
    message: 'End time must be after the start time',
    path: ['plannedEndTime'],
  });

const nodeTypeEnum = z.enum([
  'PROGRAM',
  'ACTIVITY',
  'SESSION',
  'ROUND',
  'CEREMONY',
  'COMPETITION',
  'BREAK',
  'WORKSHOP',
  'PRESENTATION',
  'TASK',
  'CUSTOM',
]);

const nodeStatusEnum = z.enum([
  'SCHEDULED',
  'READY',
  'IN_PROGRESS',
  'DELAYED',
  'COMPLETED',
  'CANCELLED',
  'SKIPPED',
]);

/**
 * Node form.
 *
 * Scheduling is entered as one date plus two times rather than two full
 * datetimes: a child almost always runs on a day its parent already covers, so
 * the date is inherited and only the times need typing. An end time that reads
 * as earlier than the start is treated as crossing midnight, not as an error.
 */
export const nodeFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is required'),
    type: nodeTypeEnum,
    customTypeName: z.string().trim().max(40, 'Keep it short').optional().or(z.literal('')),
    description: z.string().trim().max(500, 'Keep the description under 500 characters').optional().or(z.literal('')),
    date: z.string().min(1, 'Pick a date'),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Enter a start time'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Enter an end time'),
    venueId: z.string().optional().or(z.literal('')),
    status: nodeStatusEnum.optional(),
  })
  .refine((data) => data.startTime !== data.endTime, {
    message: 'Start and end cannot be the same time',
    path: ['endTime'],
  })
  .refine((data) => data.type !== 'CUSTOM' || Boolean(data.customTypeName?.trim()), {
    message: 'Name the custom type so the tree stays readable',
    path: ['customTypeName'],
  });

export const recordActualTimeSchema = z
  .object({
    actualStartTime: z.string().optional().or(z.literal('')),
    actualEndTime: z.string().optional().or(z.literal('')),
    reason: z.string().trim().min(3, 'A reason is required — it is written to the audit trail'),
  })
  .refine((data) => Boolean(data.actualStartTime || data.actualEndTime), {
    message: 'Record an actual start time, an end time, or both',
    path: ['actualStartTime'],
  })
  .refine(
    (data) =>
      !data.actualStartTime ||
      !data.actualEndTime ||
      new Date(data.actualEndTime) > new Date(data.actualStartTime),
    { message: 'End time must be after the start time', path: ['actualEndTime'] },
  );

export const createDependencySchema = z
  .object({
    predecessorId: z.string().min(1, 'Choose the node that must run first'),
    successorId: z.string().min(1, 'Choose the node that follows'),
    type: z.enum(['FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH']),
    lagMinutes: z.coerce.number().int().min(0, 'Lag cannot be negative').max(1440, 'Lag cannot exceed 24 hours').optional(),
  })
  .refine((data) => data.predecessorId !== data.successorId, {
    message: 'A node cannot depend on itself',
    path: ['successorId'],
  });

export const taskFormSchema = z.object({
  nodeId: z.string().min(1, 'Attach the task to a node'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long'),
  description: z.string().trim().max(500, 'Keep the description under 500 characters').optional().or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED', 'BLOCKED', 'CANCELLED']).optional(),
  deadline: z.string().optional().or(z.literal('')),
  assigneeUserIds: z.array(z.string()).optional(),
});

export const createVenueSchema = z.object({
  name: z.string().trim().min(2, 'Venue name is required'),
  building: z.string().trim().max(120, 'Keep it short').optional().or(z.literal('')),
  capacity: z.coerce.number().int().min(0, 'Capacity cannot be negative').max(1_000_000, 'That capacity looks wrong').optional(),
});

export const createResourceSchema = z.object({
  name: z.string().trim().min(2, 'Resource name is required'),
  type: z.string().trim().min(2, 'Type is required, e.g. AUDIO or PROJECTOR'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(100_000, 'That quantity looks wrong'),
  venueId: z.string().optional().or(z.literal('')),
});

export const createRoleSchema = z.object({
  name: z.string().trim().min(2, 'Role name is required').max(60, 'Role name is too long'),
  description: z.string().trim().max(240, 'Keep the description under 240 characters').optional().or(z.literal('')),
  category: z
    .enum([
      'ORGANIZATION_SUPER_ADMIN',
      'ORGANIZATION_ADMIN',
      'COORDINATOR',
      'VOLUNTEER',
      'JURY',
      'MEMBER',
    ])
    .optional(),
  permissionIds: z.array(z.string()).min(1, 'Select at least one permission'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type NodeFormInput = z.infer<typeof nodeFormSchema>;
export type RecordActualTimeInput = z.infer<typeof recordActualTimeSchema>;
export type CreateDependencyInput = z.output<typeof createDependencySchema>;
export type CreateDependencyFormInput = z.input<typeof createDependencySchema>;
export type TaskFormInput = z.infer<typeof taskFormSchema>;
/**
 * Schemas using `z.coerce` have a different input type (what the form holds —
 * strings straight out of `<input>`) from their output type (what the resolver
 * produces). Both are exported so `useForm` can be typed with each end.
 */
export type CreateVenueInput = z.output<typeof createVenueSchema>;
export type CreateVenueFormInput = z.input<typeof createVenueSchema>;
export type CreateResourceInput = z.output<typeof createResourceSchema>;
export type CreateResourceFormInput = z.input<typeof createResourceSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
