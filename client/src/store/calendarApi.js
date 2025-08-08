import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const calendarApi = createApi({
  reducerPath: 'calendarApi', // Уникальное имя для reducer
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }), // Базовый URL для API
  endpoints: (builder) => ({
    getCalendarEvents: builder.query({
      query: (dateRange) => `/calendar/events?start=${dateRange.start}&end=${dateRange.end}`,
    }),
  }),
});

export const { useGetCalendarEventsQuery } = calendarApi;