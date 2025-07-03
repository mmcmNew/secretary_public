import React, { createContext, useCallback, useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export const AuthContext = createContext({
  user: null,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  fetchCurrentUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    console.log('AuthContext: Checking user authentication...');
    try {
      const { data } = await axios.get('/api/user', { 
        withCredentials: true,
        timeout: 5000 // 5 секунд таймаут
      });
      console.log('AuthContext: User authenticated:', data);
      setUser(data);
      setIsLoading(false);
      return data;
    } catch (err) {
      console.log('AuthContext: Auth check failed:', err.response?.status, err.message);
      setUser(null);
      setIsLoading(false);
      return null;
    }
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      console.log('LOGIN: sending', { username, password });
      const { data } = await axios.post(
        '/api/login',
        { username, password },
        {
          headers: { 'X-CSRFToken': getCookie('csrf_token') },
          withCredentials: true,
        },
      );
      console.log('LOGIN: response', data);
      setUser(data.user);
      return null;
    } catch (err) {
      const errorMsg = err?.response?.data?.error || 'Login failed';
      console.log('LOGIN: error', errorMsg);
      return errorMsg;
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    try {
      console.log('REGISTER: sending', { username, email, password });
      const { data } = await axios.post(
        '/api/register',
        { username, email, password },
        {
          headers: { 'X-CSRFToken': getCookie('csrf_token') },
          withCredentials: true,
        },
      );
      console.log('REGISTER: response', data);
      setUser(data.user);
      return null;
    } catch (err) {
      const errorMsg = err?.response?.data?.error || 'Registration failed';
      console.log('REGISTER: error', errorMsg);
      return errorMsg;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/logout', {}, { withCredentials: true });
    } finally {
      setUser(null);
    }
  }, []);

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

