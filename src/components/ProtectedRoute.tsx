import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Redirect immediately if not authenticated (don't wait for loading to complete)
  if (!user && !loading) {
    return <Navigate to="/login" replace />;
  }

  // Render children immediately - no spinner
  return <>{children}</>;
}
