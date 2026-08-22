import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  nodeService,
  type CreateNodePayload,
  type UpdateNodePayload,
} from '@/services/api';
import { getErrorMessage, normalizeApiError } from '@/lib/apiError';
import type { EventNode } from '@/types';

/**
 * Node mutations. The resulting tree lives in `programSlice`, which reduces
 * these thunks' fulfilled actions — this slice only tracks in-flight state and
 * the detail record for the node open in the inspector.
 */

interface NodeState {
  detail: EventNode | null;
  isLoadingDetail: boolean;
  isMutating: boolean;
  error: string | null;
}

const initialState: NodeState = {
  detail: null,
  isLoadingDetail: false,
  isMutating: false,
  error: null,
};

export const createNode = createAsyncThunk(
  'node/create',
  async (payload: CreateNodePayload, { rejectWithValue }) => {
    try {
      return await nodeService.create(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateNode = createAsyncThunk(
  'node/update',
  async (
    { id, payload }: { id: string; payload: UpdateNodePayload },
    { rejectWithValue },
  ) => {
    try {
      return await nodeService.update(id, payload);
    } catch (error) {
      const normalized = normalizeApiError(error);
      return rejectWithValue(
        normalized.status === 409
          ? 'This node was changed by someone else. Reload the program to get the latest version.'
          : normalized.message,
      );
    }
  },
);

export const deleteNode = createAsyncThunk(
  'node/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await nodeService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const moveNode = createAsyncThunk(
  'node/move',
  async (
    {
      id,
      newParentId,
      newPosition,
    }: { id: string; newParentId: string | null; newPosition: number },
    { rejectWithValue },
  ) => {
    try {
      return await nodeService.move(id, newParentId, newPosition);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchNodeDetail = createAsyncThunk(
  'node/fetchDetail',
  async (id: string, { rejectWithValue }) => {
    try {
      return await nodeService.getById(id);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const nodeSlice = createSlice({
  name: 'node',
  initialState,
  reducers: {
    clearNodeDetail(state) {
      state.detail = null;
      state.error = null;
    },
    resetNodes: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNodeDetail.pending, (state) => {
        state.isLoadingDetail = true;
        state.error = null;
      })
      .addCase(fetchNodeDetail.fulfilled, (state, action) => {
        state.isLoadingDetail = false;
        state.detail = action.payload;
      })
      .addCase(fetchNodeDetail.rejected, (state, action) => {
        state.isLoadingDetail = false;
        state.error = (action.payload as string) ?? 'Could not load this node';
      })
      .addCase(updateNode.fulfilled, (state, action) => {
        if (state.detail?.id === action.payload.id) {
          state.detail = { ...state.detail, ...action.payload };
        }
      })
      .addCase(deleteNode.fulfilled, (state, action) => {
        if (state.detail?.id === action.payload) state.detail = null;
      });

    builder
      .addMatcher(
        (action) => action.type.startsWith('node/') && action.type.endsWith('/pending'),
        (state) => {
          state.isMutating = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          action.type.startsWith('node/') &&
          (action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected')),
        (state) => {
          state.isMutating = false;
        },
      );
  },
});

export const { clearNodeDetail, resetNodes } = nodeSlice.actions;
export default nodeSlice.reducer;
