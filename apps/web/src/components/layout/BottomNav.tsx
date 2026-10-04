import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Code2,
  Trophy,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Activity,
  Plus,
  X,
} from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { cn } from '@lib/utils';

const BASE_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Beranda' },
  { to: '/courses', icon: BookOpen, label: 'Belajar' },
  { to: '/playground', icon: Code2, label: 'Kode' },
  { to: '/leaderboard', icon: Trophy, label: 'Skor' },
];

const ADMIN_LINKS = [
  {
    to: '/admin',
    icon: ShieldCheck,
    label: 'Ringkasan Admin',
    desc: 'Statistik platform & aksi cepat',
  },
  {
    to: '/admin/users',
    icon: Users,
    label: 'Kelola Pengguna',
    desc: 'Daftar & status akun pengguna',
  },
  { to: '/admin/lessons/new', icon: Plus, label: 'Tambah Pelajaran', desc: 'Editor materi baru' },
  {
    to: '/admin/analytics',
    icon: Activity,
    label: 'Analytics',
    desc: 'Metrik & statistik pembelajaran',
  },
];

/** Fixed bottom navigation bar -- visible only below 640px for authenticated users. */
export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [adminDrawerOpen, setAdminDrawerOpen] = useState(false);
  const adminTriggerRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Close Admin drawer on Escape and restore focus to trigger
  useEffect(() => {
    if (!adminDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setAdminDrawerOpen(false);
        adminTriggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    // Focus close button when drawer opens
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [adminDrawerOpen]);

  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <>
      <nav
        aria-label="Navigasi Bawah"
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t sm:hidden"
        style={{
          height: 'var(--bottom-nav-height)',
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-paper-card)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {BASE_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = pathname === to || (to !== '/' && pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
                isActive ? 'text-brand-600 dark:text-brand-400' : ''
              )}
              style={isActive ? undefined : { color: 'var(--color-ink-muted)' }}
            >
              <Icon
                className={cn('h-5 w-5', isActive && 'scale-110')}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span>{label}</span>
            </NavLink>
          );
        })}

        {isAdmin && (
          <button
            ref={adminTriggerRef}
            id="bottomnav-admin-btn"
            type="button"
            onClick={() => setAdminDrawerOpen(!adminDrawerOpen)}
            aria-haspopup="dialog"
            aria-expanded={adminDrawerOpen}
            aria-controls="admin-drawer"
            aria-label="Buka menu Admin"
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
              isAdminRoute || adminDrawerOpen
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-600 dark:text-slate-400'
            )}
            style={
              isAdminRoute || adminDrawerOpen ? undefined : { color: 'var(--color-ink-muted)' }
            }
          >
            <ShieldCheck
              className={cn('h-5 w-5', (isAdminRoute || adminDrawerOpen) && 'scale-110')}
              strokeWidth={isAdminRoute || adminDrawerOpen ? 2.5 : 2}
            />
            <span>Admin</span>
          </button>
        )}
      </nav>

      {/* ── Admin Drawer Modal (Mobile) ── */}
      <AnimatePresence>
        {adminDrawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setAdminDrawerOpen(false);
                adminTriggerRef.current?.focus();
              }}
              className="backdrop-blur-xs absolute inset-0 bg-black/50"
              aria-hidden="true"
            />

            {/* Drawer Content */}
            <motion.div
              id="admin-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menu Admin"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-10 rounded-t-2xl border-t p-5 shadow-2xl"
              style={{
                backgroundColor: 'var(--color-paper-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-ink)',
                maxHeight: '85vh',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between border-b pb-4"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg p-1.5">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-heading text-base font-bold">Menu Admin</h2>
                    <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                      Navigasi kontrol administrator
                    </p>
                  </div>
                </div>
                <button
                  ref={closeBtnRef}
                  id="admin-drawer-close-btn"
                  onClick={() => {
                    setAdminDrawerOpen(false);
                    adminTriggerRef.current?.focus();
                  }}
                  className="rounded-lg p-2 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-slate-800"
                  aria-label="Tutup menu admin"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Links */}
              <div className="mt-4 space-y-2">
                {ADMIN_LINKS.map(({ to, icon: Icon, label, desc }) => {
                  const active = pathname === to;
                  return (
                    <button
                      key={to}
                      type="button"
                      onClick={() => {
                        setAdminDrawerOpen(false);
                        navigate(to);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
                        active
                          ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                          active
                            ? 'bg-brand-500 text-white'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                          {desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
