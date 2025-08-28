import { configureStore } from '@reduxjs/toolkit';
import audioReducer from './audioSlice';
import tasksReducer from './tasksSlice';
import calendarReducer from './calendarSlice';
import antiScheduleReducer from './antiScheduleSlice';
import dashboardReducer from './dashboardSlice';
import timersReducer from './timersSlice';
import uiReducer from './uiSlice';
import authReducer from './authSlice';
import todoLayoutReducer from './todoLayoutSlice';
import { apiSlice } from './api/apiSlice';

export const store = configureStore({
  reducer: {
    audio: audioReducer,
    tasks: tasksReducer,
    calendar: calendarReducer,
    antiSchedule: antiScheduleReducer,
    dashboard: dashboardReducer,
    timers: timersReducer,
    ui: uiReducer,
    auth: authReducer,
    todoLayout: todoLayoutReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware),
});
