import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { isAdmin } from '@/services/auth.service';

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

  // If admin access is required and user is not admin, redirect to home
  // We consider admin, org_admin, and super_admin as admin roles
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}
