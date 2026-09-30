import { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Code2,
  Trophy,
  LayoutDashboard,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
} from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { cn, initials } from '@lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'Belajar' },
  { to: '/playground', icon: Code2, label: 'Playground' },
  { to: '/leaderboard', icon: Trophy, label: 'Papan Skor' },
];

const FOCUS_PATTERNS = [/^\/courses\/[^/]+\/[^/]+$/, /^\/playground$/];

export default function AppSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isFocusRoute = FOCUS_PATTERNS.some((p) => p.test(pathname));
  const isTablet =
    typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024;

  // Auto-collapse on focus routes and tablet
  useEffect(() => {
    if (isFocusRoute || isTablet) {
      setCollapsed(true);
    }
  }, [isFocusRoute, isTablet]);

  // Listen for resize
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      if (w >= 640 && w < 1024) {
        setCollapsed(true);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  const toggleCollapse = useCallback(() => {
    if (!isFocusRoute) setCollapsed((c) => !c);
  }, [isFocusRoute]);

  const isAdmin = user?.role === 'ADMIN';
  const width = collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)';

  return (
    <aside
      className="sidebar-transition sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r sm:flex"
      style={{
        width,
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-paper-card)',
      }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2 px-4" style={{ height: 'var(--topbar-height)' }}>
        <div className="from-brand-400 to-brand-600 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br">
          <Code2 className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span
            className="font-heading text-lg font-bold tracking-tight"
            style={{ color: 'var(--color-ink)' }}
          >
            JS<span className="text-brand-500">Craft</span>
          </span>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'nav-item',
                collapsed && 'justify-center px-0',
                isActive && 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
              )
            }
            data-active={
              pathname === to || (to !== '/' && pathname.startsWith(to)) ? 'true' : undefined
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin"
            title={collapsed ? 'Admin' : undefined}
            className={({ isActive }) =>
              cn(
                'nav-item',
                collapsed && 'justify-center px-0',
                isActive && 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
              )
            }
          >
            <ShieldCheck className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Admin</span>}
          </NavLink>
        )}
      </nav>

      {/* ── Collapse toggle ── */}
      {!isFocusRoute && (
        <button
          onClick={toggleCollapse}
          className="mx-3 mb-2 flex items-center justify-center rounded-lg p-2 transition-colors"
          style={{ color: 'var(--color-ink-muted)' }}
          aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      )}

      {/* ── Profile pill ── */}
      <div className="relative border-t px-3 py-3" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800',
            collapsed && 'justify-center'
          )}
        >
          <div className="from-brand-400 to-brand-600 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              initials(user?.displayName ?? user?.username ?? '')
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                {user?.displayName ?? user?.username}
              </p>
              <p className="truncate text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                {user?.email}
              </p>
            </div>
          )}
        </button>

        <AnimatePresence>
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-full left-3 right-3 z-20 mb-2 rounded-xl border bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
              >
                <NavLink
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={{ color: 'var(--color-ink)' }}
                >
                  <User className="h-4 w-4" /> Profil Saya
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" /> Keluar
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
