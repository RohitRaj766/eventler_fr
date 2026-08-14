import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { programService } from '@/services/api';
import { Program, Node, NodeStatus } from '@/types';
import { CreateProgramInput } from '@/utils/validationSchemas';

interface ProgramState {
  programs: Program[];
  activeProgramTree: Node | null;
  selectedNode: Node | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProgramState = {
  programs: [],
  activeProgramTree: null,
  selectedNode: null,
  isLoading: false,
  error: null,
};

export const fetchProgramTree = createAsyncThunk(
  'program/fetchTree',
  async (programId: string, { rejectWithValue }) => {
    try {
      return await programService.getProgramTree(programId);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch program tree');
    }
  }
);

export const createProgram = createAsyncThunk(
  'program/create',
  async (data: CreateProgramInput, { rejectWithValue }) => {
    try {
      return await programService.createProgram(data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create program');
    }
  }
);

export const updateProgramStatus = createAsyncThunk(
  'program/updateStatus',
  async ({ programId, status }: { programId: string; status: NodeStatus }, { rejectWithValue }) => {
    try {
      return await programService.updateProgramStatus(programId, status);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update program status');
    }
  }
);

const programSlice = createSlice({
  name: 'program',
  initialState,
  reducers: {
    setSelectedNode(state, action: PayloadAction<Node | null>) {
      state.selectedNode = action.payload;
    },
    updateTreeRealtime(state, action: PayloadAction<any>) {
      const res = action.payload;
      if (res && res.tree && Array.isArray(res.tree) && res.tree.length > 0) {
        state.activeProgramTree = {
          ...res.tree[0],
          programId: res.id || res.programId,
          programStatus: res.status || 'DRAFT',
        };
      } else {
        state.activeProgramTree = res;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProgramTree.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProgramTree.fulfilled, (state, action) => {
        state.isLoading = false;
        const res = action.payload;
        if (res && res.tree && Array.isArray(res.tree) && res.tree.length > 0) {
          state.activeProgramTree = {
            ...res.tree[0],
            programId: res.id || res.programId,
            programStatus: res.status || 'DRAFT',
          };
        } else {
          state.activeProgramTree = res;
        }
      })
      .addCase(fetchProgramTree.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createProgram.fulfilled, (state, action) => {
        state.programs.push(action.payload);
      });
  },
});

export const { setSelectedNode, updateTreeRealtime } = programSlice.actions;
export default programSlice.reducer;
