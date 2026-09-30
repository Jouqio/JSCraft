import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { PageSpinner } from '@components/ui/Spinner';

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { status } = useAuthStore();
  const location = useLocation();

  if (status === 'restoring') {
    return <PageSpinner />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
