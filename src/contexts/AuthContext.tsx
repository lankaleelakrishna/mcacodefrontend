import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id?: number;
  username?: string;
  role_id?: number;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  requireAuth: (cb: () => void) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string | null): User | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const data = JSON.parse(jsonPayload);
    return { 
      id: data.user_id, 
      username: data.username, 
      role_id: data.role_id,
      isAdmin: data.role_id === 1 // Assuming role_id 1 is admin
    };
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => parseJwt(localStorage.getItem('token')));
  const navigate = useNavigate();

  useEffect(() => {
    // keep user in sync with token
    const u = parseJwt(token);
    setUser(u);
    if (!token) {
      setUser(null);
    }
    // also try to validate token with backend and refresh user info
    if (token) {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      fetch(`${API_BASE}/dashboard`, {
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
        credentials: 'include'
      }).then(res => res.json()).then(data => {
        if (!data.error && data.message) {
          // message like 'Welcome Admin username!'
        }
      }).catch(() => {});
    }
  }, [token]);

  const login = (newToken: string) => {
    if (!newToken) return;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    const u = parseJwt(newToken);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const requireAuth = (callback: () => void) => {
    if (!token) {
      navigate('/login');
      return;
    }
    callback();
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    requireAuth,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}