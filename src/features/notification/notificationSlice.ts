import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ToastAlert {
  id: string;
  title: string;
  description?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

interface NotificationState {
  toasts: ToastAlert[];
  unreadCount: number;
}

const initialState: NotificationState = {
  toasts: [],
  unreadCount: 0,
};

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
});

export const { addNotification, removeNotification, clearNotifications, markAllAsRead } =
  notificationSlice.actions;
export default notificationSlice.reducer;
