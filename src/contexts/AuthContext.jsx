import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE || '';

  // Fetch full profile from API when token is present. This populates email/phone
  const fetchProfile = async (tkn) => {
    if (!tkn) return;
    try {
      const res = await fetch(`${API_BASE}/user/details`, {
        method: 'GET',
        headers: {
          // Backend expects raw JWT in Authorization header (no 'Bearer ' prefix)
          Authorization: `${tkn}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('[Auth] fetchProfile failed', res.status, text);
        return;
      }
      const data = await res.json();
      console.debug('[Auth] fetchProfile data', data);
      // map backend fields (phone_number) to frontend-friendly shape
      const mapped = {
        ...data,
        phone: data.phone_number || data.phone || '',
        role: data.role || data.role_id || null,
      };
      setUser((prev) => ({ ...(prev || {}), ...mapped }));
    } catch (e) {
      console.error('[Auth] fetchProfile error', e);
    }
  };

  useEffect(() => {
    if (!token) return;
    const payload = parseJwt(token);
    if (payload && payload.username) {
      setUser({ id: payload.user_id, username: payload.username, role_id: payload.role_id });
      // try to fetch the rest of profile (email/phone) from API
      fetchProfile(token);
    } else {
      // invalid token
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    }
  }, [token]);

  const login = (newToken) => {
    if (!newToken) return;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // set user synchronously so route guards see it immediately
    const payload = parseJwt(newToken);
    if (payload) {
      setUser({ id: payload.user_id ?? payload.id, username: payload.username ?? payload.name, role_id: payload.role_id ?? payload.role });
    }
    // after login send everyone to the home page; admins can access admin pages via the admin links
    navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  // Update user profile (email/phone etc). This will optimistically update local user and
  // attempt to persist to the backend via PATCH to /api/me. If backend fails, we revert.
  const updateUser = async (updates) => {
    // optimistic: map phone -> phone_number if provided
    const prev = user;
    const localUpdates = { ...(updates || {}) };
    if (localUpdates.phone && !localUpdates.phone_number) {
      localUpdates.phone_number = localUpdates.phone;
      delete localUpdates.phone;
    }
    setUser((u) => ({ ...(u || {}), ...localUpdates, phone: localUpdates.phone_number || localUpdates.phone || u?.phone }));
    if (!token) return { ok: false, message: 'Not authenticated' };
    try {
      const body = {};
      // Only allow expected fields
      if (localUpdates.username) body.username = localUpdates.username;
      if (localUpdates.email) body.email = localUpdates.email;
      if (localUpdates.phone_number) body.phone_number = localUpdates.phone_number;
      if (localUpdates.password) body.password = localUpdates.password;

      const res = await fetch(`${API_BASE}/user/details`, {
        method: 'PUT',
        headers: {
          // Backend expects raw JWT in Authorization header (no 'Bearer ' prefix)
          Authorization: `${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        // revert
        setUser(prev);
        const text = await res.text();
        console.error('[Auth] updateUser failed', res.status, text);
        return { ok: false, message: text || res.statusText };
      }
      const data = await res.json();
      console.debug('[Auth] updateUser response', data);
  const mapped = { ...data, phone: data.phone_number || data.phone || '', role: data.role || data.role_id || null };
  setUser((u) => ({ ...(u || {}), ...mapped }));
      return { ok: true, data };
    } catch (e) {
      setUser(prev);
      return { ok: false, message: e.message };
    }
  };

  const requireAuth = (callback) => {
    if (!token) {
      navigate('/login');
      return;
    }
    callback();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, requireAuth, isAuthenticated: !!token, fetchProfile, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);