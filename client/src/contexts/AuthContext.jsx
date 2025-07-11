import React, { createContext, useState, useEffect, useCallback } from 'react';
import { api, apiPost } from './api';
import { useContext } from 'react';
import { ErrorContext } from './ErrorContext';

export const AuthContext = createContext({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  fetchCurrentUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setError } = useContext(ErrorContext);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await api('/api/user');
      setUser(data);
      return data;
    } catch (err) {
      console.warn('fetchCurrentUser failed:', err?.response?.status || err.message);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const data = await apiPost('/api/login', { username, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setUser(data.user);
      return null;
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        (err?.response?.status === 401 ? 'Invalid username or password' : 'Login failed');
      setError(msg);
      return msg;
    }
  }, [setError]);

  const register = useCallback(async (username, email, password) => {
    try {
      const data = await apiPost('/api/register', { username, email, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setUser(data.user);
      return null;
    } catch (err) {
      const msg = err?.response?.data?.error || 'Registration failed';
      setError(msg);
      return msg;
    }
  }, [setError]);

  const logout = useCallback(async () => {
    try {
      await apiPost('/api/logout');
    } catch (err) {
      setError('Ошибка выхода из аккаунта');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  }, [setError]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}
