import { apiSlice } from './apiSlice';
import { createContainer } from '../dashboardSlice'; // Нам все еще нужна эта утилита

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    fetchDashboard: builder.query({
      query: () => '/dashboard/last',
      transformResponse: (response) => {
        // Преобразуем данные так же, как это делал createAsyncThunk
        const loadedContainers = (response.data.containers || []).map((containerData) =>
          createContainer(containerData.type, containerData.id, containerData)
        );
        return { ...response.data, containers: loadedContainers };
      },
      providesTags: ['Dashboard'],
    }),
    saveDashboard: builder.mutation({
      query: (dashboard) => ({
        url: '/dashboard',
        method: 'POST',
        body: dashboard,
      }),
      invalidatesTags: ['Dashboard'],
    }),
  }),
});

export const { useFetchDashboardQuery, useSaveDashboardMutation } = dashboardApi;