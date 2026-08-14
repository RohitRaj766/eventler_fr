import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import orgReducer from '@/features/org/orgSlice';
import programReducer from '@/features/program/programSlice';
import nodeReducer from '@/features/node/nodeSlice';
import dependencyReducer from '@/features/dependency/dependencySlice';
import liveEngineReducer from '@/features/liveEngine/liveEngineSlice';
import taskReducer from '@/features/task/taskSlice';
import venueReducer from '@/features/venue/venueSlice';
import roleReducer from '@/features/role/roleSlice';
import auditReducer from '@/features/audit/auditSlice';
import notificationReducer from '@/features/notification/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    org: orgReducer,
    program: programReducer,
    node: nodeReducer,
    dependency: dependencyReducer,
    liveEngine: liveEngineReducer,
    task: taskReducer,
    venue: venueReducer,
    role: roleReducer,
    audit: auditReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
