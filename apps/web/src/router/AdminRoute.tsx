import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { PageSpinner } from '@components/ui/Spinner';

interface Props { children: ReactNode; }

export default function AdminRoute({ children }: Props) {
  const { user, isAuthenticated, isHydrating } = useAuthStore();

  if (isHydrating)     return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
