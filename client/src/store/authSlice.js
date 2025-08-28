import { createSlice } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: localStorage.getItem('accessToken') || null,
    isAuthenticated: !!localStorage.getItem('accessToken'), // Если есть токен, считаем аутентифицированным
    isLoading: !!localStorage.getItem('accessToken'), // Загружаем только если есть токен
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = !!(user && accessToken); // Истина только если есть и юзер и токен
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      // Clear RTK Query cache when new credentials are set (e.g., on login/registration)
      apiSlice.util.resetApiState();
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // Clear RTK Query cache on logout
      apiSlice.util.resetApiState();
    },
    authLoadingDone: (state) => {
      state.isLoading = false;
    }
  },
});

export const {
  setCredentials,
  logout,
  authLoadingDone
} = authSlice.actions;

export default authSlice.reducer;
