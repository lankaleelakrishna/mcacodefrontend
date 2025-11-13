import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// AdminProtectedRoute now accepts an optional `allowedRoles` prop
// (array of role ids or role names). Defaults to [1]. Comparison is
// string-safe so both numeric and string role ids work.
export default function AdminProtectedRoute({ children, allowedRoles = [1], redirectTo = '/' }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role_id;
  const allowed = Array.isArray(allowedRoles)
    ? allowedRoles.some((r) => String(r) === String(userRole))
    : String(allowedRoles) === String(userRole);

  if (!allowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
