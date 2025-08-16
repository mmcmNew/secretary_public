
import { apiSlice } from './apiSlice';

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createDashboard: builder.mutation({
      query: (dashboard) => ({
        url: '/dashboard/create',
        method: 'POST',
        body: dashboard,
      }),
      invalidatesTags: ['Dashboard'],
    }),
    fetchDashboard: builder.query({
      query: () => '/dashboard/last',
      // Возвращаем ответ сервера как есть, преобразование контейнеров — в dashboardSlice
      providesTags: ['Dashboard'],
    }),
    saveDashboard: builder.mutation({
      query: (dashboard) => {
        // id обязателен для обновления
        return {
          url: '/dashboard/update',
          method: 'POST',
          body: dashboard,
        };
      },
      invalidatesTags: ['Dashboard'],
    }),

    listDashboards: builder.query({
      query: () => '/dashboard/list',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useFetchDashboardQuery, useSaveDashboardMutation, useCreateDashboardMutation, useListDashboardsQuery } = dashboardApi;