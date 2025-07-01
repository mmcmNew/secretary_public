import React, { createContext, useCallback, useState } from 'react';
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

  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/user', { withCredentials: true });
      setUser(data);
      return data;
    } catch (err) {
      setUser(null);
      return null;
    }
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const { data } = await axios.post(
        '/api/login',
        { username, password },
        {
          headers: { 'X-CSRFToken': getCookie('csrf_token') },
          withCredentials: true,
        },
      );
      setUser(data.user);
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    try {
      const { data } = await axios.post(
        '/api/register',
        { username, email, password },
        {
          headers: { 'X-CSRFToken': getCookie('csrf_token') },
          withCredentials: true,
        },
      );
      setUser(data.user);
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/logout', {}, { withCredentials: true });
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

