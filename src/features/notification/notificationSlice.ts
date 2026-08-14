import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { notificationService } from '@/services/api';

export interface ToastAlert {
  id: string;
  title: string;
  description?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

interface NotificationState {
  toasts: ToastAlert[];
  serverNotifications: any[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  toasts: [],
  serverNotifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

export const fetchMyNotifications = createAsyncThunk(
  'notification/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationService.getMyNotifications();
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Omit<ToastAlert, 'id' | 'timestamp'>>) {
      const newToast: ToastAlert = {
        ...action.payload,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
      };
      state.toasts.unshift(newToast);
      state.unreadCount += 1;
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearNotifications(state) {
      state.toasts = [];
      state.unreadCount = 0;
    },
    markAllAsRead(state) {
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.serverNotifications = action.payload || [];
        state.unreadCount = action.payload?.length || 0;
      })
      .addCase(fetchMyNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addNotification, removeNotification, clearNotifications, markAllAsRead } =
  notificationSlice.actions;
export default notificationSlice.reducer;
