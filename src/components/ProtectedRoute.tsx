import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Redirect if not authenticated (only after loading completes)
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  // Render children immediately - no spinner
  return <>{children}</>;
}
