import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { metaService } from '@/services/api';
import { getErrorMessage } from '@/lib/apiError';
import type {
  EnumOption,
  NodeTypeMeta,
  OrgRoleMeta,
  Permission,
  RolePermissionPools,
  SystemEnums,
  Venue,
} from '@/types';
import { roleService } from '@/services/api';

/**
 * Backend-declared metadata.
 *
 * Every dropdown in the app reads from here rather than from a hardcoded enum,
 * so adding a node type or task status server-side shows up in the UI without
 * a frontend change. The system-wide entries never change during a session and
 * are fetched exactly once; the org-scoped ones are re-fetched on org switch.
 */

interface MetaState {
  enums: SystemEnums | null;
  nodeTypes: NodeTypeMeta[];
  permissionPools: RolePermissionPools | null;
  permissions: Permission[];
  orgRoles: OrgRoleMeta[];
  orgVenues: Venue[];
  systemLoaded: boolean;
  isLoadingSystem: boolean;
  isLoadingOrgScoped: boolean;
  error: string | null;
}

const initialState: MetaState = {
  enums: null,
  nodeTypes: [],
  permissionPools: null,
  permissions: [],
  orgRoles: [],
  orgVenues: [],
  systemLoaded: false,
  isLoadingSystem: false,
  isLoadingOrgScoped: false,
  error: null,
};

/** Fetched once per session — these values are immutable server-side. */
export const fetchSystemMetadata = createAsyncThunk(
  'meta/fetchSystem',
  async (_: void, { rejectWithValue }) => {
    try {
      const [enums, nodeTypes, permissionPools, permissions] = await Promise.all([
        metaService.getEnums(),
        metaService.getNodeTypes(),
        metaService.getRolePermissionPools(),
        // Requires a token but no tenant header, and every RBAC screen needs it.
        roleService.listPermissions().catch(() => [] as Permission[]),
      ]);
      return { enums, nodeTypes, permissionPools, permissions };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  {
    condition: (_: void, { getState }) => {
      const { meta } = getState() as { meta: MetaState };
      return !meta.systemLoaded && !meta.isLoadingSystem;
    },
  },
);

/** Re-run whenever the active organization changes. */
export const fetchOrgMetadata = createAsyncThunk(
  'meta/fetchOrgScoped',
  async (_: void, { rejectWithValue }) => {
    try {
      const [orgRoles, orgVenues] = await Promise.all([
        metaService.getOrgRoles().catch(() => [] as OrgRoleMeta[]),
        metaService.getOrgVenues().catch(() => [] as Venue[]),
      ]);
      return { orgRoles, orgVenues };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const metaSlice = createSlice({
  name: 'meta',
  initialState,
  reducers: {
    /** Drops org-scoped caches when the tenant context changes. */
    clearOrgMetadata(state) {
      state.orgRoles = [];
      state.orgVenues = [];
    },
    resetMetadata: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSystemMetadata.pending, (state) => {
        state.isLoadingSystem = true;
        state.error = null;
      })
      .addCase(fetchSystemMetadata.fulfilled, (state, action) => {
        state.isLoadingSystem = false;
        state.systemLoaded = true;
        state.enums = action.payload.enums;
        state.nodeTypes = action.payload.nodeTypes ?? [];
        state.permissionPools = action.payload.permissionPools;
        state.permissions = action.payload.permissions ?? [];
      })
      .addCase(fetchSystemMetadata.rejected, (state, action) => {
        state.isLoadingSystem = false;
        state.error = (action.payload as string) ?? 'Could not load system metadata';
      })
      .addCase(fetchOrgMetadata.pending, (state) => {
        state.isLoadingOrgScoped = true;
      })
      .addCase(fetchOrgMetadata.fulfilled, (state, action) => {
        state.isLoadingOrgScoped = false;
        state.orgRoles = action.payload.orgRoles ?? [];
        state.orgVenues = action.payload.orgVenues ?? [];
      })
      .addCase(fetchOrgMetadata.rejected, (state) => {
        state.isLoadingOrgScoped = false;
      });
  },
});

export const { clearOrgMetadata, resetMetadata } = metaSlice.actions;
export default metaSlice.reducer;

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

type RootLike = { meta: MetaState };

/**
 * Enum options with a compile-time-safe fallback, so a screen still renders a
 * usable dropdown if the metadata request has not landed (or failed).
 */
function optionsOrFallback<T extends string>(
  fromServer: EnumOption<T>[] | undefined,
  fallback: readonly T[],
): EnumOption<T>[] {
  if (fromServer?.length) return fromServer;
  return fallback.map((value) => ({
    value,
    label: value.replace(/_/g, ' '),
  }));
}

export const selectProgramStatusOptions = (state: RootLike) =>
  optionsOrFallback(state.meta.enums?.programStatus, [
    'DRAFT',
    'PLANNED',
    'PUBLISHED',
    'LIVE',
    'PAUSED',
    'COMPLETED',
    'CANCELLED',
  ] as const);

export const selectNodeStatusOptions = (state: RootLike) =>
  optionsOrFallback(state.meta.enums?.nodeStatus, [
    'SCHEDULED',
    'READY',
    'IN_PROGRESS',
    'DELAYED',
    'COMPLETED',
    'CANCELLED',
    'SKIPPED',
  ] as const);

export const selectNodeTypeOptions = (state: RootLike) => {
  if (state.meta.nodeTypes.length) {
    return state.meta.nodeTypes.map((item) => ({ value: item.type, label: item.label }));
  }
  return optionsOrFallback(state.meta.enums?.nodeTypeCategory, [
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
  ] as const);
};

export const selectTaskStatusOptions = (state: RootLike) =>
  optionsOrFallback(state.meta.enums?.taskStatus, [
    'PENDING',
    'IN_PROGRESS',
    'READY',
    'COMPLETED',
    'BLOCKED',
    'CANCELLED',
  ] as const);

export const selectTaskPriorityOptions = (state: RootLike) =>
  optionsOrFallback(state.meta.enums?.taskPriority, ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const);

export const selectDependencyTypeOptions = (state: RootLike) =>
  optionsOrFallback(state.meta.enums?.dependencyType, [
    'FINISH_TO_START',
    'START_TO_START',
    'FINISH_TO_FINISH',
    'START_TO_FINISH',
  ] as const);

export const selectRoleCategoryOptions = (state: RootLike) =>
  (state.meta.permissionPools?.categories ?? []).map((category) => ({
    value: category.category,
    label: category.label,
  }));
