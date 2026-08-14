import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskService } from '@/services/api';
import { Task } from '@/types';
import { CreateTaskInput } from '@/utils/validationSchemas';

interface TaskState {
  nodeTasks: Task[];
  allOrgTasks: Task[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TaskState = {
  nodeTasks: [],
  allOrgTasks: [],
  isLoading: false,
  error: null,
};

export const fetchTasksByNode = createAsyncThunk(
  'task/fetchByNode',
  async (nodeId: string, { rejectWithValue }) => {
    try {
      return await taskService.getTasksByNode(nodeId);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const createTask = createAsyncThunk(
  'task/create',
  async (data: CreateTaskInput, { rejectWithValue }) => {
    try {
      return await taskService.createTask(data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'task/update',
  async ({ id, updates }: { id: string; updates: Partial<Task> }, { rejectWithValue }) => {
    try {
      return await taskService.updateTask(id, updates);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update task');
    }
  }
);

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasksByNode.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTasksByNode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.nodeTasks = action.payload || [];
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.nodeTasks.push(action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.nodeTasks.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.nodeTasks[index] = action.payload;
        }
      });
  },
});

export default taskSlice.reducer;
