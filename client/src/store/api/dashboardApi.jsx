
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
    getDashboard: builder.query({
      queryFn: async (id, _queryApi, _extraOptions, baseQuery) => {
        let response;
        if (id) {
          response = await baseQuery(`/dashboard/${id}`);
          if (response.data && !response.error) {
            return { data: response.data };
          }
        }
        // If no id is provided or if the fetch by id fails, fetch the last dashboard
        response = await baseQuery('/dashboard/last');
        return response.error ? { error: response.error } : { data: response.data };
      },
      providesTags: (result, error, id) => (result ? [{ type: 'Dashboard', id }] : ['Dashboard']),
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

export const { useGetDashboardQuery, useSaveDashboardMutation, useCreateDashboardMutation, useListDashboardsQuery } = dashboardApi;