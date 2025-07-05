import React, { createContext, useCallback, useState, useEffect } from 'react';
import axios from 'axios';

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

const storedToken = getCookie('access_token');
if (storedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
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

  const refreshToken = useCallback(async () => {
    const refresh = getCookie('refresh_token');
    if (!refresh) return false;
    
    try {
      const { data } = await axios.post('/api/refresh', {}, {
        headers: { 'Authorization': `Bearer ${refresh}` }
      });
      const newToken = getCookie('access_token');
      if (newToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      }
      return true;
    } catch (err) {
      console.log('Token refresh failed:', err.message);
      delete axios.defaults.headers.common['Authorization'];
      return false;
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const token = getCookie('access_token');
    if (!token) {
      setIsLoading(false);
      setUser(null);
      return null;
    }
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('AuthContext: Checking user authentication...');
    try {
      const { data } = await axios.get('/api/user', { timeout: 5000 });
      console.log('AuthContext: User authenticated:', data);
      setUser(data);
      setIsLoading(false);
      return data;
    } catch (err) {
      if (err.response?.status === 401) {
        console.log('Token expired, trying to refresh...');
        const refreshed = await refreshToken();
        if (refreshed) {
          return fetchCurrentUser();
        }
      }
      console.log('AuthContext: Auth check failed:', err.response?.status, err.message);
      setUser(null);
      setIsLoading(false);
      return null;
    }
  }, [refreshToken]);

  const login = useCallback(async (username, password) => {
    try {
      console.log('LOGIN: sending', { username, password });
      const { data } = await axios.post(
        '/api/login',
        { username, password },
        {
          headers: { 'X-CSRFToken': getCookie('csrf_token') },
        },
      );
      console.log('LOGIN: response', data);
      const token = getCookie('access_token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      setUser(data.user);
      return null;
    } catch (err) {
      const status = err?.response?.status;
      let errorMsg = 'Login failed';
      if (status === 401) {
        errorMsg = 'Invalid username or password';
      } else if (err?.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
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
        },
      );
      console.log('REGISTER: response', data);
      const token = getCookie('access_token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
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
      await axios.post('/api/logout');
    } finally {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  }, []);

  // Настраиваем axios interceptor для автоматического обновления токенов
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          const refreshed = await refreshToken();
          if (refreshed) {
            return axios(error.config);
          }
        }
        return Promise.reject(error);
      }
    );
    
    return () => axios.interceptors.response.eject(interceptor);
  }, [refreshToken]);

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

