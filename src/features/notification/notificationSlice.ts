import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { notificationService } from '@/services/api';
import { getErrorMessage } from '@/lib/apiError';
import type { AppNotification } from '@/types';

interface NotificationState {
  items: AppNotification[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  /**
   * False when the backend has no mark-as-read route, so the UI can say the
   * read state is only remembered on this device.
   */
  readStatePersistedRemotely: boolean;
}

const initialState: NotificationState = {
  items: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,
  readStatePersistedRemotely: true,
};

export const fetchNotifications = createAsyncThunk(
  'notification/fetch',
  async (userId: string, { rejectWithValue }) => {
    try {
      return await notificationService.list(userId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const markNotificationRead = createAsyncThunk(
  'notification/markRead',
  async (
    { userId, notificationId }: { userId: string; notificationId: string },
    { rejectWithValue },
  ) => {
    try {
      const result = await notificationService.markAsRead(userId, notificationId);
      return { notificationId, ...result };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const markAllNotificationsRead = createAsyncThunk(
  'notification/markAllRead',
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const { notification } = getState() as { notification: NotificationState };
      const unreadIds = notification.items.filter((item) => !item.isRead).map((item) => item.id);
      const result = await notificationService.markAllAsRead(userId, unreadIds);
      return { ids: unreadIds, ...result };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    /** Prepends a notification pushed over the realtime channel. */
    applyRealtimeNotification(state, action: PayloadAction<AppNotification>) {
      if (state.items.some((item) => item.id === action.payload.id)) return;
      state.items.unshift(action.payload);
    },
    resetNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload ?? [];
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) ?? 'Could not load notifications';
      })

      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find((entry) => entry.id === action.payload.notificationId);
        if (item) item.isRead = true;
        if (!action.payload.persistedRemotely) state.readStatePersistedRemotely = false;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state, action) => {
        const ids = new Set(action.payload.ids);
        state.items.forEach((item) => {
          if (ids.has(item.id)) item.isRead = true;
        });
        if (!action.payload.persistedRemotely) state.readStatePersistedRemotely = false;
      });
  },
});

export const { applyRealtimeNotification, resetNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;

export const selectUnreadCount = (state: { notification: NotificationState }) =>
  state.notification.items.filter((item) => !item.isRead).length;
