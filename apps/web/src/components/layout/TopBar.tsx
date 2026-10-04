import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Code2, BookOpen, Trophy, Sun, Moon, Menu, X, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { useThemeStore } from '@store/themeStore';
import { xpService, formatXP } from '@lib/xp';
import { cn, initials } from '@lib/utils';
import { Button } from '@components/ui/Button';

const PUBLIC_LINKS = [
  { to: '/courses', icon: BookOpen, label: 'Belajar' },
  { to: '/playground', icon: Code2, label: 'Playground' },
  { to: '/leaderboard', icon: Trophy, label: 'Papan Skor' },
];

export default function TopBar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { setTheme, resolvedTheme } = useThemeStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const avatarTriggerRef = useRef<HTMLButtonElement>(null);

  // Close avatar menu on Escape and restore focus
  useEffect(() => {
    if (!avatarMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setAvatarMenuOpen(false);
        avatarTriggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [avatarMenuOpen]);

  // Close mobile nav menu on Escape and restore focus
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMobileMenuOpen(false);
        mobileMenuTriggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const levelInfo = user ? xpService.levelFromXP(user.xpTotal) : null;

  // ── Anonymous TopBar ──
  if (!isAuthenticated) {
    return (
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          height: 'var(--topbar-height)',
          borderColor: 'var(--color-border)',
          backgroundColor: 'color-mix(in srgb, var(--color-paper-card) 90%, transparent)',
        }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <div className="from-brand-400 to-brand-600 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm">
              <Code2 className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span
              className="font-heading text-lg font-bold tracking-tight"
              style={{ color: 'var(--color-ink)' }}
            >
              JS<span className="text-brand-500">Craft</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {PUBLIC_LINKS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  )
                }
                style={{ color: 'var(--color-ink-muted)' }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              style={{ color: 'var(--color-ink-muted)' }}
              aria-label="Ganti tema"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Masuk
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Daftar
              </Button>
            </div>

            {/* Mobile hamburger */}
            <button
              ref={mobileMenuTriggerRef}
              id="topbar-hamburger-btn"
              className="rounded-lg p-2 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 md:hidden dark:hover:bg-slate-800"
              style={{ color: 'var(--color-ink-muted)' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu navigasi"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t md:hidden"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-paper-card)',
              }}
            >
              <nav className="flex flex-col gap-1 p-4">
                {PUBLIC_LINKS.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700' : ''
                      )
                    }
                    style={{ color: 'var(--color-ink-muted)' }}
                  >
                    {label}
                  </NavLink>
                ))}
                <div className="mt-2 flex gap-2 sm:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                  >
                    Masuk
                  </Button>
                  <Button
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/register');
                    }}
                  >
                    Daftar
                  </Button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    );
  }

  // ── Authenticated TopBar ──
  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{
        height: 'var(--topbar-height)',
        borderColor: 'var(--color-border)',
        backgroundColor: 'color-mix(in srgb, var(--color-paper-card) 90%, transparent)',
      }}
    >
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        {/* Mobile logo (visible only below sm) */}
        <Link to="/" className="flex shrink-0 items-center gap-2 sm:hidden">
          <div className="from-brand-400 to-brand-600 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br">
            <Code2 className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span
            className="font-heading text-base font-bold tracking-tight"
            style={{ color: 'var(--color-ink)' }}
          >
            JS<span className="text-brand-500">Craft</span>
          </span>
        </Link>

        {/* Spacer (desktop) */}
        <div className="hidden flex-1 sm:block" />

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* XP / Level badge */}
          {user && (
            <div className="mr-1 hidden items-center gap-2 sm:flex">
              <span className="xp-badge">{formatXP(user.xpTotal)} XP</span>
              <span className="level-badge">Lv.{levelInfo?.level}</span>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: 'var(--color-ink-muted)' }}
            aria-label="Ganti tema"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Avatar menu -- mobile only (< sm) to prevent duplicate avatar on desktop/tablet */}
          <div className="relative sm:hidden">
            <button
              ref={avatarTriggerRef}
              id="topbar-avatar-btn"
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-slate-800"
              aria-label="Menu pengguna"
              aria-haspopup="menu"
              aria-expanded={avatarMenuOpen}
            >
              <div className="from-brand-400 to-brand-600 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white">
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
            </button>

            <AnimatePresence>
              {avatarMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAvatarMenuOpen(false)} />
                  <motion.div
                    role="menu"
                    aria-label="Opsi pengguna"
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border shadow-lg"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-paper-card)',
                    }}
                  >
                    <div className="border-b p-3" style={{ borderColor: 'var(--color-border)' }}>
                      <p
                        className="truncate text-sm font-semibold"
                        style={{ color: 'var(--color-ink)' }}
                      >
                        {user?.displayName ?? user?.username}
                      </p>
                      <p className="truncate text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-1">
                      <Link
                        to="/profile"
                        role="menuitem"
                        onClick={() => setAvatarMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-slate-800"
                        style={{ color: 'var(--color-ink)' }}
                      >
                        <User className="h-4 w-4" /> Profil Saya
                      </Link>
                      <button
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="h-4 w-4" /> Keluar
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
