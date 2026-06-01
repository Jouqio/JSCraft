import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@store/authStore';

/** Convenience hook for auth actions with navigation side-effects */
export function useAuth() {
  const store    = useAuthStore();
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    await store.logout();
    toast.success('Berhasil keluar');
    navigate('/', { replace: true });
  }, [store, navigate]);

  const requireAuth = useCallback((redirectTo = '/login') => {
    if (!store.isAuthenticated) {
      toast.error('Silakan login terlebih dahulu');
      navigate(redirectTo);
      return false;
    }
    return true;
  }, [store.isAuthenticated, navigate]);

  return {
    user:            store.user,
    isAuthenticated: store.isAuthenticated,
    isHydrating:     store.isHydrating,
    isAdmin:         store.user?.role === 'ADMIN',
    logout,
    requireAuth,
  };
}
