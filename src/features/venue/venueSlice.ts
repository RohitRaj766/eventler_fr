import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { venueService } from '@/services/api';
import { Venue, Resource } from '@/types';
import { CreateVenueInput, CreateResourceInput } from '@/utils/validationSchemas';

interface VenueState {
  venues: Venue[];
  resources: Resource[];
  isLoading: boolean;
  error: string | null;
}

const initialState: VenueState = {
  venues: [],
  resources: [],
  isLoading: false,
  error: null,
};

export const fetchVenues = createAsyncThunk(
  'venue/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await venueService.getVenues();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch venues');
    }
  }
);

export const createVenue = createAsyncThunk(
  'venue/create',
  async (data: CreateVenueInput, { rejectWithValue }) => {
    try {
      return await venueService.createVenue(data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create venue');
    }
  }
);

export const fetchResources = createAsyncThunk(
  'venue/fetchResources',
  async (_, { rejectWithValue }) => {
    try {
      return await venueService.getResources();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch resources');
    }
  }
);

export const createResource = createAsyncThunk(
  'venue/createResource',
  async (data: CreateResourceInput, { rejectWithValue }) => {
    try {
      return await venueService.createResource(data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create resource');
    }
  }
);

const venueSlice = createSlice({
  name: 'venue',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVenues.fulfilled, (state, action) => {
        state.venues = action.payload || [];
      })
      .addCase(createVenue.fulfilled, (state, action) => {
        state.venues.push(action.payload);
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.resources = action.payload || [];
      })
      .addCase(createResource.fulfilled, (state, action) => {
        state.resources.push(action.payload);
      });
  },
});

export default venueSlice.reducer;
