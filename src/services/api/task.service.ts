import type { Task, TaskPriority, TaskStatus, User } from '@/types';
import { apiGet, apiPatch, apiPost } from './axiosInstance';

export interface CreateTaskPayload {
  nodeId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  deadline?: string;
  assigneeUserIds?: string[];
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: string | null;
  assigneeUserIds?: string[];
  /**
   * Optimistic lock. Send the version you loaded; a stale value returns 409
   * with "Task data is stale. Please refresh."
   * (Swagger's `expectedVersion` is silently ignored by the server.)
   */
  version: number;
}

/**
 * Strips the bcrypt hash the backend currently leaks on
 * `POST /tasks` -> `assignments[].user.passwordHash`, so it never
 * reaches the store, the DOM, or a console log.
 */
export function scrubTask(task: Task): Task {
  if (!task?.assignments?.length) return task;
  return {
    ...task,
    assignments: task.assignments.map((assignment) => {
      if (!assignment.user) return assignment;
      const unsafeUser = assignment.user as User & { passwordHash?: string };
      const safeUser: User = { ...unsafeUser };
      delete (safeUser as { passwordHash?: string }).passwordHash;
      return { ...assignment, user: safeUser };
    }),
  };
}

export const taskService = {
  async create(payload: CreateTaskPayload) {
    return scrubTask(await apiPost<Task>('/tasks', payload));
  },

  async update(id: string, payload: UpdateTaskPayload) {
    return scrubTask(await apiPatch<Task>(`/tasks/${id}`, payload));
  },

  async listByNode(nodeId: string) {
    const tasks = await apiGet<Task[]>(`/tasks/node/${nodeId}`);
    return (tasks ?? []).map(scrubTask);
  },

  /** Org-wide task list. Undocumented in Swagger but implemented. */
  async listForOrg() {
    const tasks = await apiGet<Task[]>('/tasks');
    return (tasks ?? []).map(scrubTask);
  },
};
