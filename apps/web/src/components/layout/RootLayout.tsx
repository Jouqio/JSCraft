import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { useProgressStore } from '@store/progressStore';
import Navbar from './Navbar';

// Routes that render their own full-screen layout (no global navbar)
const BARE_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

export default function RootLayout() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { syncFromServer } = useProgressStore();
  const isBareRoute = BARE_ROUTES.some((r) => pathname.startsWith(r));

  // Sync progress from server on auth state change
  useEffect(() => {
    if (isAuthenticated) {
      syncFromServer();
    }
  }, [isAuthenticated, syncFromServer]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {!isBareRoute && <Navbar />}
      <main className={isBareRoute ? '' : 'flex-1'}>
        <Outlet />
      </main>
    </div>
  );
}
