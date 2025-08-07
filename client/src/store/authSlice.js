import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: localStorage.getItem('accessToken') || null,
    isAuthenticated: false, // По умолчанию пользователь не аутентифицирован
    isLoading: true, // Добавляем состояние для начальной загрузки
    isAuthModalOpen: false,
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
    },
    openAuthModal: (state) => {
      state.isAuthModalOpen = true;
    },
    closeAuthModal: (state) => {
      state.isAuthModalOpen = false;
    },
  },
});

export const {
  setCredentials,
  logout,
  authLoadingDone,
  openAuthModal,
  closeAuthModal,
} = authSlice.actions;

export default authSlice.reducer;
