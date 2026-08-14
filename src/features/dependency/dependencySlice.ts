import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dependencyService } from '@/services/api';
import { CreateDependencyInput } from '@/utils/validationSchemas';

interface DependencyState {
  isLoading: boolean;
  error: string | null;
}

const initialState: DependencyState = {
  isLoading: false,
  error: null,
};

export const createDependency = createAsyncThunk(
  'dependency/create',
  async (data: CreateDependencyInput, { rejectWithValue }) => {
    try {
      return await dependencyService.createDependency(data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to link dependency');
    }
  }
);

export const removeDependency = createAsyncThunk(
  'dependency/remove',
  async ({ predecessorId, successorId }: { predecessorId: string; successorId: string }, { rejectWithValue }) => {
    try {
      return await dependencyService.removeDependency(predecessorId, successorId);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove dependency');
    }
  }
);

const dependencySlice = createSlice({
  name: 'dependency',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createDependency.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createDependency.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createDependency.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default dependencySlice.reducer;
