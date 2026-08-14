import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { nodeService } from '@/services/api';
import { Node } from '@/types';
import { CreateNodeInput } from '@/utils/validationSchemas';

interface NodeState {
  currentNodeDetails: Node | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: NodeState = {
  currentNodeDetails: null,
  isLoading: false,
  error: null,
};

export const createNode = createAsyncThunk(
  'node/create',
  async (payload: { programId: string; parentId?: string; data: CreateNodeInput }, { rejectWithValue }) => {
    try {
      return await nodeService.createNode(payload);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create node');
    }
  }
);

export const updateNode = createAsyncThunk(
  'node/update',
  async ({ id, updates }: { id: string; updates: Partial<CreateNodeInput> }, { rejectWithValue }) => {
    try {
      return await nodeService.updateNode(id, updates);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update node');
    }
  }
);

export const moveNode = createAsyncThunk(
  'node/move',
  async ({ id, newParentId, newSortOrder }: { id: string; newParentId?: string | null; newSortOrder?: number }, { rejectWithValue }) => {
    try {
      return await nodeService.moveNode(id, newParentId, newSortOrder);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to move node');
    }
  }
);

export const deleteNode = createAsyncThunk(
  'node/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const data = await nodeService.deleteNode(id);
      return { id, data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete node');
    }
  }
);

export const fetchNodeDetails = createAsyncThunk(
  'node/fetchDetails',
  async (id: string, { rejectWithValue }) => {
    try {
      return await nodeService.getNodeDetails(id);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch node details');
    }
  }
);

const nodeSlice = createSlice({
  name: 'node',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNodeDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNodeDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentNodeDetails = action.payload;
      })
      .addCase(fetchNodeDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default nodeSlice.reducer;
