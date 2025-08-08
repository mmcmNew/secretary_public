import { configureStore } from '@reduxjs/toolkit';
import audioReducer from './audioSlice';
import tasksReducer from './tasksSlice';
import listsReducer from './listsSlice';
import calendarReducer from './calendarSlice';
import antiScheduleReducer from './antiScheduleSlice';
import dashboardReducer from './dashboardSlice';
import timersReducer from './timersSlice';
import uiReducer from './uiSlice';
import authReducer from './authSlice';
import todoLayoutReducer from './todoLayoutSlice';
import { apiSlice } from './api/apiSlice';
import { tasksApi } from './tasksSlice';
import { listsApi } from './listsSlice';
import { calendarApi } from './calendarSlice';

export const store = configureStore({
  reducer: {
    audio: audioReducer,
    tasks: tasksReducer,
    lists: listsReducer,
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
