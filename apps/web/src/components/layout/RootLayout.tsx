import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { useProgressStore } from '@store/progressStore';
import { cn } from '@lib/utils';
import TopBar from './TopBar';
import AppSidebar from './AppSidebar';
import BottomNav from './BottomNav';

// Routes that render their own full-screen layout (no global shell)
const BARE_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];
const FOCUS_PATTERNS = [/^\/courses\/[^/]+\/[^/]+$/, /^\/playground$/];

export default function RootLayout() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { syncFromServer } = useProgressStore();
  const isBareRoute = BARE_ROUTES.some((r) => pathname.startsWith(r));
  const isFocusRoute = FOCUS_PATTERNS.some((p) => p.test(pathname));

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

  // Bare routes: no shell at all
  if (isBareRoute) {
    return <Outlet />;
  }

  // Anonymous: TopBar only, no sidebar or bottom nav
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <a href="#main-content" className="skip-to-content">
          Lewati ke konten utama
        </a>
        <TopBar />
        <main
          id="main-content"
          className={cn('flex-1', !isFocusRoute && 'px-4 py-6 sm:px-6 lg:px-8')}
        >
          <Outlet />
        </main>
      </div>
    );
  }

  // Authenticated: Sidebar (desktop/tablet) + TopBar + BottomNav (mobile)
  return (
    <div className="flex min-h-screen">
      <a href="#main-content" className="skip-to-content">
        Lewati ke konten utama
      </a>
      <AppSidebar />

      <div className="shell-content flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main
          id="main-content"
          className={cn('flex-1', !isFocusRoute && 'px-4 py-6 sm:px-6 lg:px-8')}
        >
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
