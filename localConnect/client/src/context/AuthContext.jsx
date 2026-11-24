import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('lc_access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await authService.getMe();
      setUser(me);
    } catch {
      localStorage.removeItem('lc_access_token');
      localStorage.removeItem('lc_refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener('lc:auth-expired', handleExpired);
    return () => window.removeEventListener('lc:auth-expired', handleExpired);
  }, [loadUser]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    localStorage.setItem('lc_access_token', data.accessToken);
    localStorage.setItem('lc_refresh_token', data.refreshToken);
    const me = await authService.getMe();
    setUser(me);
    return me;
  };

  const register = async (payload) => {
    const data = await authService.register(payload);
    localStorage.setItem('lc_access_token', data.accessToken);
    localStorage.setItem('lc_refresh_token', data.refreshToken);
    const me = await authService.getMe();
    setUser(me);
    return me;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('lc_refresh_token');
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Clear local session even if server revoke fails
    } finally {
      localStorage.removeItem('lc_access_token');
      localStorage.removeItem('lc_refresh_token');
      setUser(null);
    }
  };

  const refreshUser = async () => {
    const me = await authService.getMe();
    setUser(me);
    return me;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

