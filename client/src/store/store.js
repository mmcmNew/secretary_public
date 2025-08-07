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
    [apiSlice.reducerPath]: apiSlice.reducer,
    [tasksApi.reducerPath]: tasksApi.reducer,
    [listsApi.reducerPath]: listsApi.reducer,
    [calendarApi.reducerPath]: calendarApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware)
      .concat(tasksApi.middleware)
      .concat(listsApi.middleware)
      .concat(calendarApi.middleware),
});
