import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auditService } from '@/services/api';
import { AuditLog } from '@/types';

interface AuditState {
  logs: AuditLog[];
  isLoading: boolean;
  error: string | null;
}

const initialState: AuditState = {
  logs: [],
  isLoading: false,
  error: null,
};

export const fetchAuditLogs = createAsyncThunk(
  'audit/fetchLogs',
  async (params: { action?: string; entityType?: string } | undefined = {}, { rejectWithValue }) => {
    try {
      return await auditService.getAuditLogs(params);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch audit logs');
    }
  }
);

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.logs = action.payload || [];
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default auditSlice.reducer;
