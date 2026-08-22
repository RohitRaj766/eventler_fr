import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  venueService,
  type CreateResourcePayload,
  type CreateVenuePayload,
} from '@/services/api';
import { getErrorMessage } from '@/lib/apiError';
import type { PhysicalResource, Venue } from '@/types';

interface VenueState {
  venues: Venue[];
  resources: PhysicalResource[];
  isLoadingVenues: boolean;
  isLoadingResources: boolean;
  isMutating: boolean;
  venuesError: string | null;
  resourcesError: string | null;
}

const initialState: VenueState = {
  venues: [],
  resources: [],
  isLoadingVenues: false,
  isLoadingResources: false,
  isMutating: false,
  venuesError: null,
  resourcesError: null,
};

export const fetchVenues = createAsyncThunk(
  'venue/fetchVenues',
  async (_: void, { rejectWithValue }) => {
    try {
      return await venueService.listVenues();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const fetchResources = createAsyncThunk(
  'venue/fetchResources',
  async (_: void, { rejectWithValue }) => {
    try {
      return await venueService.listResources();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const createVenue = createAsyncThunk(
  'venue/createVenue',
  async (payload: CreateVenuePayload, { rejectWithValue }) => {
    try {
      return await venueService.createVenue(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const createResource = createAsyncThunk(
  'venue/createResource',
  async (payload: CreateResourcePayload, { rejectWithValue }) => {
    try {
      return await venueService.createResource(payload);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const venueSlice = createSlice({
  name: 'venue',
  initialState,
  reducers: {
    resetVenues: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVenues.pending, (state) => {
        state.isLoadingVenues = true;
        state.venuesError = null;
      })
      .addCase(fetchVenues.fulfilled, (state, action) => {
        state.isLoadingVenues = false;
        state.venues = action.payload ?? [];
      })
      .addCase(fetchVenues.rejected, (state, action) => {
        state.isLoadingVenues = false;
        state.venuesError = (action.payload as string) ?? 'Could not load venues';
      })

      .addCase(fetchResources.pending, (state) => {
        state.isLoadingResources = true;
        state.resourcesError = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.isLoadingResources = false;
        state.resources = action.payload ?? [];
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.isLoadingResources = false;
        state.resourcesError = (action.payload as string) ?? 'Could not load resources';
      })

      .addCase(createVenue.pending, (state) => {
        state.isMutating = true;
      })
      .addCase(createVenue.fulfilled, (state, action) => {
        state.isMutating = false;
        state.venues.unshift(action.payload);
      })
      .addCase(createVenue.rejected, (state) => {
        state.isMutating = false;
      })

      .addCase(createResource.pending, (state) => {
        state.isMutating = true;
      })
      .addCase(createResource.fulfilled, (state, action) => {
        state.isMutating = false;
        state.resources.unshift(action.payload);
      })
      .addCase(createResource.rejected, (state) => {
        state.isMutating = false;
      });
  },
});

export const { resetVenues } = venueSlice.actions;
export default venueSlice.reducer;
