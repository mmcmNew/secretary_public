import { apiSlice } from './apiSlice';

export const calendarApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCalendarEvents: builder.query({
      query: ({ start, end }) => `/calendar/events?start=${start}&end=${end}`,
      providesTags: ['CalendarEvent'],
    }),
  }),
});

export const { useGetCalendarEventsQuery } = calendarApi;