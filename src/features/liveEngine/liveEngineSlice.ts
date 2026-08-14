import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/services/api';
import { ScheduleChange } from '@/types';
import { RecordActualTimeInput } from '@/utils/validationSchemas';

interface LiveEngineState {
  scheduleChanges: ScheduleChange[];
  lastImpactCorrelationId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LiveEngineState = {
  scheduleChanges: [],
  lastImpactCorrelationId: null,
  isLoading: false,
  error: null,
};

export const recordActualTime = createAsyncThunk(
  'liveEngine/recordActualTime',
  async (data: RecordActualTimeInput, { rejectWithValue }) => {
    try {
      const response = await api.post('/live/actual-time', data);
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to record actual time');
    }
  }
);

export const fetchScheduleChanges = createAsyncThunk(
  'liveEngine/fetchScheduleChanges',
  async (programId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/live/changes/${programId}`);
      return response.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch schedule changes');
    }
  }
);

const liveEngineSlice = createSlice({
  name: 'liveEngine',
  initialState,
  reducers: {
    addRealtimeScheduleChange(state, action: PayloadAction<ScheduleChange>) {
      state.scheduleChanges.unshift(action.payload);
      state.lastImpactCorrelationId = action.payload.correlationId;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(recordActualTime.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(recordActualTime.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.changeLog) {
          state.scheduleChanges.unshift(action.payload.changeLog);
        }
      })
      .addCase(recordActualTime.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchScheduleChanges.fulfilled, (state, action) => {
        state.scheduleChanges = action.payload || [];
      });
  },
});

export const { addRealtimeScheduleChange } = liveEngineSlice.actions;
export default liveEngineSlice.reducer;
