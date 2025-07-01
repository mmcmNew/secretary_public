import React, { createContext, useCallback, useState } from 'react';
import axios from 'axios';

export const AuthContext = createContext({
  user: null,
  login: async () => false,
  logout: async () => {},
  fetchCurrentUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/user');
      setUser(data);
      return data;
    } catch (err) {
      setUser(null);
      return null;
    }
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const { data } = await axios.post('/api/login', { username, password });
      setUser(data.user);
      return true;
    } catch (err) {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/logout');
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

