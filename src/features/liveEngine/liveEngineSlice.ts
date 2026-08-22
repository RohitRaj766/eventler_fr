import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  liveEngineService,
  type RecordActualTimePayload,
} from '@/services/api';
import { getErrorMessage, isVersionConflict, normalizeApiError } from '@/lib/apiError';
import type { LivePropagationResult, ScheduleChange } from '@/types';

interface LiveEngineState {
  scheduleChanges: ScheduleChange[];
  isLoadingChanges: boolean;
  changesError: string | null;
  isRecording: boolean;
  /** The most recent propagation, so the operator sees its downstream impact. */
  lastPropagation: LivePropagationResult | null;
}

const initialState: LiveEngineState = {
  scheduleChanges: [],
  isLoadingChanges: false,
  changesError: null,
  isRecording: false,
  lastPropagation: null,
};

export const fetchScheduleChanges = createAsyncThunk(
  'liveEngine/fetchChanges',
  async (programId: string, { rejectWithValue }) => {
    try {
      return await liveEngineService.getScheduleChanges(programId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Records an actual timestamp. The backend recomputes projected times for
 * every downstream node and returns which ones moved, so the UI can show the
 * blast radius rather than just confirming the write.
 */
export const recordActualTime = createAsyncThunk(
  'liveEngine/recordActualTime',
  async (payload: RecordActualTimePayload, { rejectWithValue }) => {
    try {
      return await liveEngineService.recordActualTime(payload);
    } catch (error) {
      if (isVersionConflict(error)) {
        return rejectWithValue(
          'This node changed since you opened it. Reload the program and record the time again.',
        );
      }
      return rejectWithValue(normalizeApiError(error).message);
    }
  },
);

const liveEngineSlice = createSlice({
  name: 'liveEngine',
  initialState,
  reducers: {
    /** Prepends a schedule change pushed over the realtime channel. */
    applyRealtimeScheduleChange(state, action: PayloadAction<ScheduleChange>) {
      if (state.scheduleChanges.some((change) => change.id === action.payload.id)) return;
      state.scheduleChanges.unshift(action.payload);
    },
    clearLastPropagation(state) {
      state.lastPropagation = null;
    },
    resetLiveEngine: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchScheduleChanges.pending, (state) => {
        state.isLoadingChanges = true;
        state.changesError = null;
      })
      .addCase(fetchScheduleChanges.fulfilled, (state, action) => {
        state.isLoadingChanges = false;
        state.scheduleChanges = action.payload ?? [];
      })
      .addCase(fetchScheduleChanges.rejected, (state, action) => {
        state.isLoadingChanges = false;
        state.changesError = (action.payload as string) ?? 'Could not load schedule history';
      })

      .addCase(recordActualTime.pending, (state) => {
        state.isRecording = true;
      })
      .addCase(recordActualTime.fulfilled, (state, action) => {
        state.isRecording = false;
        state.lastPropagation = action.payload;
        if (action.payload.changeRecord) {
          state.scheduleChanges.unshift(action.payload.changeRecord);
        }
      })
      .addCase(recordActualTime.rejected, (state) => {
        state.isRecording = false;
      });
  },
});

export const { applyRealtimeScheduleChange, clearLastPropagation, resetLiveEngine } =
  liveEngineSlice.actions;
export default liveEngineSlice.reducer;
