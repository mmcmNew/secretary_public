
import { createSlice } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';

const calendarSlice = createSlice({
  name: 'calendar',
  initialState: {
    events: [],
    range: null,
    loading: false,
    error: null,
    version: 0, // Добавляем отслеживание версии
    isFetching: false, // Добавляем статус загрузки
  },
  reducers: {
    setCalendarRange: (state, action) => {
      state.range = action.payload;
    },
    setCalendarVersion: (state, action) => { // Добавляем редьюсер для установки версии
      state.version = action.payload;
    },
  },
});

export const { setCalendarRange, setCalendarVersion } = calendarSlice.actions;

export default calendarSlice.reducer;

export const calendarApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCalendarEvents: builder.query({
      query: (range) => ({
        url: '/tasks/calendar',
        params: range,
      }),
      providesTags: ['CalendarEvent'],
    }),
  }),
});

export const {
  useGetCalendarEventsQuery,
} = calendarApi;
