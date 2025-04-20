import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If admin access is required and user is not admin/org_admin/super_admin, redirect to home
  if (adminOnly && !['admin', 'org_admin', 'super_admin'].includes(user?.role || '')) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}
