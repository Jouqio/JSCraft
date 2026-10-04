import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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

  // Redirect authenticated users from '/' to '/dashboard'
  useEffect(() => {
    if (isAuthenticated && pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, pathname, navigate]);

  // Scroll to top on route change (both window and main scrollable container)
  useEffect(() => {
    window.scrollTo(0, 0);
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.scrollTop = 0;
      if (typeof mainEl.scrollTo === 'function') {
        mainEl.scrollTo(0, 0);
      }
    }
  }, [pathname]);

  // Bare routes: no shell at all
  if (isBareRoute) {
    return <Outlet />;
  }

  // Anonymous: TopBar only, no sidebar or bottom nav
  if (!isAuthenticated) {
    return (
      <div
        className="flex min-h-screen flex-col"
        style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
      >
        <a
          href="#main-content"
          className="skip-to-content"
          onClick={() => {
            const mainEl = document.getElementById('main-content');
            if (mainEl) {
              mainEl.focus();
            }
          }}
        >
          Lewati ke konten utama
        </a>
        <TopBar />
        <main
          id="main-content"
          tabIndex={-1}
          className={cn('flex-1 focus:outline-none', !isFocusRoute && 'px-4 py-6 sm:px-6 lg:px-8')}
        >
          <Outlet />
        </main>
      </div>
    );
  }

  // Authenticated: Sidebar (desktop/tablet) + TopBar + BottomNav (mobile)
  // Shell h-dvh with independently scrolling content area and internal sidebar scroll
  return (
    <div
      className="flex h-dvh h-screen max-h-dvh max-h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
    >
      <a
        href="#main-content"
        className="skip-to-content"
        onClick={() => {
          const mainEl = document.getElementById('main-content');
          if (mainEl) {
            mainEl.focus();
          }
        }}
      >
        Lewati ke konten utama
      </a>
      <AppSidebar />

      <div className="shell-content flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'min-h-0 flex-1 overflow-y-auto focus:outline-none',
            !isFocusRoute && 'px-4 py-6 sm:px-6 lg:px-8'
          )}
        >
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
