import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('campusbridge_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('campusbridge_token') || null);
  const [loading, setLoading] = useState(false);

  const fetchCurrentUser = async () => {
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
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    }
  }, [token]);

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

  const logout = () => {
    localStorage.removeItem('campusbridge_token');
    localStorage.removeItem('campusbridge_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
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

export const useAuth = () => useContext(AuthContext);
