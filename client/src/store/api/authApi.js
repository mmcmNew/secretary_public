import { apiSlice } from './apiSlice';
import { setCredentials, logout } from '../authSlice';

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    login: builder.mutation({
      query: credentials => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const { user, access_token, refresh_token } = data;
          dispatch(setCredentials({ user, accessToken: access_token, refreshToken: refresh_token }));
        } catch {
          // Ошибки обрабатываются в baseQuery, здесь можно ничего не делать
        }
      },
    }),
    register: builder.mutation({
      query: userInfo => ({
        url: '/register',
        method: 'POST',
        body: userInfo,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const { user, access_token, refresh_token } = data;
          dispatch(setCredentials({ user, accessToken: access_token, refreshToken: refresh_token }));
        } catch {
          // Ошибки обрабатываются в baseQuery, здесь можно ничего не делать
        }
      },
    }),
    refreshAccessToken: builder.mutation({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const { user, access_token } = data;
          dispatch(setCredentials({ user, accessToken: access_token }));
        } catch {
          // Ошибки обрабатываются в baseQuery, здесь можно ничего не делать
        }
      },
    }),
    getMe: builder.query({
      query: () => '/user', // На сервере это /api/user
    }),
    getDemoToken: builder.mutation({
      query: () => '/demo/auth',
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials({
            user: data.data.user,
            accessToken: data.data.token
          }));
        } catch (err) {
          // Handle error if needed
        }
      }
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshAccessTokenMutation,
  useGetMeQuery,
  useGetDemoTokenMutation
} = authApiSlice;
