import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { auditService, type AuditQuery } from '@/services/api';
import { getErrorMessage } from '@/lib/apiError';
import type { AuditLog } from '@/types';

interface AuditState {
  logs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  lastQuery: AuditQuery;
}

const initialState: AuditState = {
  logs: [],
  isLoading: false,
  error: null,
  lastQuery: {},
};

/**
 * `GET /audit` accepts only `programId` server-side; every other filter the
 * screen offers is applied client-side over the returned page.
 */
export const fetchAuditLogs = createAsyncThunk(
  'audit/fetch',
  async (query: AuditQuery = {}, { rejectWithValue }) => {
    try {
      return { logs: await auditService.list(query), query };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    resetAudit: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.logs = action.payload.logs ?? [];
        state.lastQuery = action.payload.query;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'Could not load audit logs';
      });
  },
});

export const { resetAudit } = auditSlice.actions;
export default auditSlice.reducer;
