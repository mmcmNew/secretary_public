import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setCredentials, logout, authLoadingDone } from '../../store/authSlice';

// Мокаем localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('authSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('initial state', () => {
    it('should set isAuthenticated to true if token exists in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      
      const store = configureStore({
        reducer: {
          auth: authReducer,
        },
      });

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(true);
      expect(state.accessToken).toBe('test-token');
    });

    it('should set isAuthenticated to false if no token in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const store = configureStore({
        reducer: {
          auth: authReducer,
        },
      });

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.accessToken).toBe(null);
    });
  });

  describe('setCredentials', () => {
    it('should set user and token data correctly', () => {
      const userData = { id: 1, username: 'testuser' };
      const token = 'new-access-token';
      const refreshToken = 'new-refresh-token';

      store.dispatch(setCredentials({ 
        user: userData, 
        accessToken: token, 
        refreshToken 
      }));

      const state = store.getState().auth;
      expect(state.user).toEqual(userData);
      expect(state.accessToken).toBe(token);
      expect(state.isAuthenticated).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', refreshToken);
    });
  });

  describe('logout', () => {
    it('should clear all auth data', () => {
      // Сначала устанавливаем данные
      store.dispatch(setCredentials({ 
        user: { id: 1 }, 
        accessToken: 'token' 
      }));

      // Затем выходим
      store.dispatch(logout());

      const state = store.getState().auth;
      expect(state.user).toBe(null);
      expect(state.accessToken).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('authLoadingDone', () => {
    it('should set isLoading to false', () => {
      store.dispatch(authLoadingDone());
      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
    });
  });
});