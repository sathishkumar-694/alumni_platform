import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../services/api';
import { AuthContext } from './auth-context.js';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('campusbridge_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('campusbridge_token') || null);
  const heartbeatRef = useRef(null);

  // Send presence heartbeat every 30s while logged in
  useEffect(() => {
    if (!token) {
      clearInterval(heartbeatRef.current);
      return;
    }
    const beat = () => apiClient('/presence/heartbeat', { method: 'POST' }).catch(() => {});
    beat();
    heartbeatRef.current = setInterval(beat, 30000);
    const onVisible = () => { if (!document.hidden) beat(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(heartbeatRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem('campusbridge_token');
    localStorage.removeItem('campusbridge_user');
    setToken(null);
    setUser(null);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      localStorage.removeItem('campusbridge_user');
      return;
    }
    try {
      const res = await apiClient('/auth/me');
      if (res.data) {
        setUser(res.data);
        localStorage.setItem('campusbridge_user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Auth validation failed:', err.message);
      logout();
    }
  }, [logout, token]);

  useEffect(() => {
    if (token) {
      const timer = window.setTimeout(() => { void fetchCurrentUser(); }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [fetchCurrentUser, token]);

  const loginUser = async (email, password) => {
    const res = await apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const { user: userData, token: jwtToken } = res.data;
    localStorage.setItem('campusbridge_token', jwtToken);
    localStorage.setItem('campusbridge_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const registerStudentUser = async (formData) => {
    const res = await apiClient('/auth/register/student', {
      method: 'POST',
      body: formData
    });
    const { user: userData, token: jwtToken } = res.data;
    localStorage.setItem('campusbridge_token', jwtToken);
    localStorage.setItem('campusbridge_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const registerAlumniUser = async (formData) => {
    const res = await apiClient('/auth/register/alumni', {
      method: 'POST',
      body: formData
    });
    const { user: userData, token: jwtToken } = res.data;
    localStorage.setItem('campusbridge_token', jwtToken);
    localStorage.setItem('campusbridge_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login: loginUser,
        registerStudent: registerStudentUser,
        registerAlumni: registerAlumniUser,
        logout,
        refreshUser: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
