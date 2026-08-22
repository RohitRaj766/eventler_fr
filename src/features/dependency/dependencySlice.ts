import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { dependencyService, type CreateDependencyPayload } from '@/services/api';
import { isCycleError, normalizeApiError } from '@/lib/apiError';
import type { NodeDependency } from '@/types';

interface DependencyState {
  isMutating: boolean;
  error: string | null;
  /** Set when the backend's DFS refused the edge for closing a cycle. */
  cycleRejected: boolean;
}

const initialState: DependencyState = {
  isMutating: false,
  error: null,
  cycleRejected: false,
};

export const createDependency = createAsyncThunk(
  'dependency/create',
  async (payload: CreateDependencyPayload, { rejectWithValue }) => {
    try {
      return await dependencyService.create(payload);
    } catch (error) {
      return rejectWithValue({
        cycle: isCycleError(error),
        message: isCycleError(error)
          ? 'That link would create a loop — the node would end up waiting on itself. Pick a different predecessor.'
          : normalizeApiError(error).message,
      });
    }
  },
);

export const removeDependency = createAsyncThunk(
  'dependency/remove',
  async (
    { predecessorId, successorId }: { predecessorId: string; successorId: string },
    { rejectWithValue },
  ) => {
    try {
      await dependencyService.remove(predecessorId, successorId);
      return { predecessorId, successorId };
    } catch (error) {
      return rejectWithValue({ cycle: false, message: normalizeApiError(error).message });
    }
  },
);

const dependencySlice = createSlice({
  name: 'dependency',
  initialState,
  reducers: {
    clearDependencyError(state) {
      state.error = null;
      state.cycleRejected = false;
    },
    resetDependencies: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDependency.pending, (state) => {
        state.isMutating = true;
        state.error = null;
        state.cycleRejected = false;
      })
      .addCase(createDependency.fulfilled, (state) => {
        state.isMutating = false;
      })
      .addCase(createDependency.rejected, (state, action) => {
        state.isMutating = false;
        const payload = action.payload as { cycle: boolean; message: string } | undefined;
        state.error = payload?.message ?? 'Could not create the dependency';
        state.cycleRejected = payload?.cycle ?? false;
      })
      .addCase(removeDependency.pending, (state) => {
        state.isMutating = true;
      })
      .addCase(removeDependency.fulfilled, (state) => {
        state.isMutating = false;
      })
      .addCase(removeDependency.rejected, (state, action) => {
        state.isMutating = false;
        state.error = (action.payload as { message: string } | undefined)?.message ?? null;
      });
  },
});

export const { clearDependencyError, resetDependencies } = dependencySlice.actions;
export default dependencySlice.reducer;

export type { NodeDependency };
