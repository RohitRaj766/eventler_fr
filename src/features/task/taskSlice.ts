import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { taskService, type CreateTaskPayload, type UpdateTaskPayload } from '@/services/api';
import { getErrorMessage, isVersionConflict, normalizeApiError } from '@/lib/apiError';
import type { Task } from '@/types';

interface TaskState {
  /** Org-wide list backing the /tasks board. */
  tasks: Task[];
  /** Tasks for the node open in the program workspace, keyed by node id. */
  byNode: Record<string, Task[]>;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  /** Set when an update lost an optimistic-lock race. */
  conflictTaskId: string | null;
}

const initialState: TaskState = {
  tasks: [],
  byNode: {},
  isLoading: false,
  isMutating: false,
  error: null,
  conflictTaskId: null,
};

export const fetchOrgTasks = createAsyncThunk(
  'task/fetchOrgTasks',
  async (_: void, { rejectWithValue }) => {
    try {
      return await taskService.listForOrg();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchTasksByNode = createAsyncThunk(
  'task/fetchByNode',
  async (nodeId: string, { rejectWithValue }) => {
    try {
      return { nodeId, tasks: await taskService.listByNode(nodeId) };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const createTask = createAsyncThunk(
  'task/create',
  async (payload: CreateTaskPayload, { rejectWithValue }) => {
    try {
      return await taskService.create(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Updates a task under optimistic locking.
 *
 * The backend rejects a stale `version` with 409 rather than overwriting, so a
 * losing update surfaces as a conflict the user can resolve instead of quietly
 * clobbering someone else's change.
 */
export const updateTask = createAsyncThunk(
  'task/update',
  async (
    { id, payload }: { id: string; payload: UpdateTaskPayload },
    { rejectWithValue },
  ) => {
    try {
      return await taskService.update(id, payload);
    } catch (error) {
      if (isVersionConflict(error)) {
        return rejectWithValue({
          taskId: id,
          message:
            'Someone else updated this task first. Refresh to load their changes before editing again.',
        });
      }
      return rejectWithValue({ taskId: null, message: normalizeApiError(error).message });
    }
  },
);

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    clearTaskConflict(state) {
      state.conflictTaskId = null;
    },
    /** Applies a realtime task push. */
    applyTaskPatch(state, action: { payload: Task }) {
      const task = action.payload;
      const index = state.tasks.findIndex((item) => item.id === task.id);
      if (index !== -1) state.tasks[index] = task;
      const bucket = state.byNode[task.nodeId];
      if (bucket) {
        const nodeIndex = bucket.findIndex((item) => item.id === task.id);
        if (nodeIndex !== -1) bucket[nodeIndex] = task;
      }
    },
    resetTasks: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrgTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrgTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload ?? [];
      })
      .addCase(fetchOrgTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'Could not load tasks';
      })

      .addCase(fetchTasksByNode.fulfilled, (state, action) => {
        state.byNode[action.payload.nodeId] = action.payload.tasks;
      })

      .addCase(createTask.pending, (state) => {
        state.isMutating = true;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isMutating = false;
        state.tasks.unshift(action.payload);
        const bucket = state.byNode[action.payload.nodeId];
        if (bucket) bucket.unshift(action.payload);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isMutating = false;
        state.error = (action.payload as string) ?? 'Could not create the task';
      })

      .addCase(updateTask.pending, (state) => {
        state.isMutating = true;
        state.conflictTaskId = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isMutating = false;
        const task = action.payload;
        const index = state.tasks.findIndex((item) => item.id === task.id);
        if (index !== -1) state.tasks[index] = task;
        const bucket = state.byNode[task.nodeId];
        if (bucket) {
          const nodeIndex = bucket.findIndex((item) => item.id === task.id);
          if (nodeIndex !== -1) bucket[nodeIndex] = task;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isMutating = false;
        const payload = action.payload as { taskId: string | null; message: string } | undefined;
        state.error = payload?.message ?? 'Could not update the task';
        state.conflictTaskId = payload?.taskId ?? null;
      });
  },
});

export const { clearTaskConflict, applyTaskPatch, resetTasks } = taskSlice.actions;
export default taskSlice.reducer;
