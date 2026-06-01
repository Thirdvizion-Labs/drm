import { Navigate } from 'react-router-dom';
import { getUser } from '../api/auth';

export function ProtectedRoute({ children }) {
  return getUser() ? children : <Navigate to="/login" replace />;
}

export function AdminRoute({ children }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.role !== 'instructor') return <Navigate to="/dashboard" replace />;
  return children;
}
