import { createSlice } from '@reduxjs/toolkit';

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
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
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
