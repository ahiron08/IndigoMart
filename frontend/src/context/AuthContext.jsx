import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import api from '@/services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    setUser(response.data.data.user);
    return response.data.data.user;
  }, []);

  const register = useCallback(async (details) => {
    const response = await api.post('/auth/register', details);
    setUser(response.data.data.user);
    return response.data.data.user;
  }, []);

  const registerCustomer = useCallback(async (details) => {
    const response = await api.post('/auth/register/customer', details);
    setUser(response.data.data.user);
    return response.data.data.user;
  }, []);

  const registerSeller = useCallback(async (details) => {
    const formData = new FormData();
    Object.entries(details).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    const response = await api.post('/auth/register/seller', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setUser(response.data.data.user);
    return response.data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: Boolean(user), login, register, registerCustomer, registerSeller, logout, restoreSession }),
    [user, isLoading, login, register, registerCustomer, registerSeller, logout, restoreSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
};