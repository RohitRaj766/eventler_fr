import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { programService, type CreateProgramPayload } from '@/services/api';
import { getErrorMessage } from '@/lib/apiError';
import type { EventNode, Program, ProgramStatus, ProgramTree } from '@/types';
import {
  buildForest,
  removeNodeFromForest,
  replaceNodeInForest,
} from '@/utils/nodeTreeHelpers';
import { createNode, deleteNode, moveNode, updateNode } from '@/features/node/nodeSlice';

/**
 * Program list plus the tree currently open in the workspace.
 *
 * Node mutations live in `nodeSlice` but are folded into the tree here, so the
 * workspace updates without a full refetch after every edit.
 */

interface ProgramState {
  programs: Program[];
  isLoadingPrograms: boolean;
  programsError: string | null;

  /** The program open in the workspace, without its node arrays. */
  current: Program | null;
  /** Nested node forest — normally a single PROGRAM root. */
  tree: EventNode[];
  /** Flat mirror, handy for pickers and lookups. */
  flatNodes: EventNode[];
  isLoadingTree: boolean;
  treeError: string | null;

  selectedNodeId: string | null;
  isUpdatingStatus: boolean;
}

const initialState: ProgramState = {
  programs: [],
  isLoadingPrograms: false,
  programsError: null,
  current: null,
  tree: [],
  flatNodes: [],
  isLoadingTree: false,
  treeError: null,
  selectedNodeId: null,
  isUpdatingStatus: false,
};

/** Splits a `/programs/:id` response into program + tree + flat list. */
function adoptTree(state: ProgramState, payload: ProgramTree) {
  const { nodes, tree, ...program } = payload;
  state.current = program as Program;
  state.flatNodes = nodes ?? [];
  // Prefer the server's nesting; rebuild from the flat list if it is missing.
  state.tree = tree?.length ? tree : buildForest(nodes ?? []);
  if (state.selectedNodeId && !state.flatNodes.some((node) => node.id === state.selectedNodeId)) {
    state.selectedNodeId = null;
  }
}

/** Re-derives the flat mirror after a structural change. */
function reflatten(state: ProgramState) {
  const out: EventNode[] = [];
  const walk = (node: EventNode) => {
    out.push(node);
    node.children?.forEach(walk);
  };
  state.tree.forEach(walk);
  state.flatNodes = out;
}

export const fetchPrograms = createAsyncThunk(
  'program/fetchPrograms',
  async (_: void, { rejectWithValue }) => {
    try {
      return await programService.list();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchProgramTree = createAsyncThunk(
  'program/fetchTree',
  async (programId: string, { rejectWithValue }) => {
    try {
      return await programService.getTree(programId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const createProgram = createAsyncThunk(
  'program/create',
  async (payload: CreateProgramPayload, { rejectWithValue }) => {
    try {
      return await programService.create(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateProgramStatus = createAsyncThunk(
  'program/updateStatus',
  async (
    { programId, status }: { programId: string; status: ProgramStatus },
    { rejectWithValue },
  ) => {
    try {
      return await programService.updateStatus(programId, status);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const programSlice = createSlice({
  name: 'program',
  initialState,
  reducers: {
    selectNode(state, action: PayloadAction<string | null>) {
      state.selectedNodeId = action.payload;
    },
    /** Applies a realtime tree push without a refetch. */
    applyTreeSnapshot(state, action: PayloadAction<ProgramTree>) {
      adoptTree(state, action.payload);
    },
    /** Applies a realtime single-node update. */
    applyNodePatch(state, action: PayloadAction<EventNode>) {
      state.tree = replaceNodeInForest(state.tree, action.payload);
      reflatten(state);
    },
    clearProgramWorkspace(state) {
      state.current = null;
      state.tree = [];
      state.flatNodes = [];
      state.selectedNodeId = null;
      state.treeError = null;
    },
    /** Clears everything on sign-out or org switch. */
    resetPrograms: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrograms.pending, (state) => {
        state.isLoadingPrograms = true;
        state.programsError = null;
      })
      .addCase(fetchPrograms.fulfilled, (state, action) => {
        state.isLoadingPrograms = false;
        state.programs = action.payload ?? [];
      })
      .addCase(fetchPrograms.rejected, (state, action) => {
        state.isLoadingPrograms = false;
        state.programsError = (action.payload as string) ?? 'Could not load programs';
      })

      .addCase(fetchProgramTree.pending, (state) => {
        state.isLoadingTree = true;
        state.treeError = null;
      })
      .addCase(fetchProgramTree.fulfilled, (state, action) => {
        state.isLoadingTree = false;
        adoptTree(state, action.payload);
      })
      .addCase(fetchProgramTree.rejected, (state, action) => {
        state.isLoadingTree = false;
        state.treeError = (action.payload as string) ?? 'Could not load this program';
      })

      .addCase(createProgram.fulfilled, (state, action) => {
        state.programs.unshift(action.payload);
      })

      .addCase(updateProgramStatus.pending, (state) => {
        state.isUpdatingStatus = true;
      })
      .addCase(updateProgramStatus.fulfilled, (state, action) => {
        state.isUpdatingStatus = false;
        const index = state.programs.findIndex((program) => program.id === action.payload.id);
        if (index !== -1) state.programs[index] = action.payload;
        if (state.current?.id === action.payload.id) state.current = action.payload;
      })
      .addCase(updateProgramStatus.rejected, (state) => {
        state.isUpdatingStatus = false;
      })

      /* Node mutations reshape the open tree. */
      .addCase(createNode.fulfilled, (state, action) => {
        const created = { ...action.payload, children: [] };
        if (!created.parentId) {
          state.tree.push(created);
        } else {
          const attach = (nodes: EventNode[]): EventNode[] =>
            nodes.map((node) => {
              if (node.id === created.parentId) {
                return { ...node, children: [...(node.children ?? []), created] };
              }
              return node.children?.length
                ? { ...node, children: attach(node.children) }
                : node;
            });
          state.tree = attach(state.tree);
        }
        reflatten(state);
        state.selectedNodeId = created.id;
      })
      .addCase(updateNode.fulfilled, (state, action) => {
        state.tree = replaceNodeInForest(state.tree, action.payload);
        reflatten(state);
      })
      .addCase(deleteNode.fulfilled, (state, action) => {
        state.tree = removeNodeFromForest(state.tree, action.payload);
        reflatten(state);
        if (state.selectedNodeId === action.payload) state.selectedNodeId = null;
      })
      .addCase(moveNode.fulfilled, (state, action) => {
        // A move re-parents a whole branch, so rebuild from the flat list
        // rather than trying to patch two places in the nesting.
        const moved = action.payload;
        const flat = state.flatNodes.map((node) =>
          node.id === moved.id
            ? { ...node, parentId: moved.parentId, sortOrder: moved.sortOrder, version: moved.version }
            : node,
        );
        state.flatNodes = flat;
        state.tree = buildForest(flat);
      });
  },
});

export const {
  selectNode,
  applyTreeSnapshot,
  applyNodePatch,
  clearProgramWorkspace,
  resetPrograms,
} = programSlice.actions;

export default programSlice.reducer;
