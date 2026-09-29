import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  LayoutDashboard,
  BookOpen,
  Trophy,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { useThemeStore } from '@store/themeStore';
import { xpService, formatXP } from '@lib/xp';
import { initials } from '@lib/utils';
import { Button } from '@components/ui/Button';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { setTheme, resolvedTheme } = useThemeStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const levelInfo = user ? xpService.levelFromXP(user.xpTotal) : null;

  return (
    <header className="sticky top-0 z-40 h-[60px] border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="from-brand-400 to-brand-600 shadow-brand flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br">
            <Code2 className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            JS<span className="text-brand-500">Craft</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {[
            { to: '/courses', icon: <BookOpen className="h-4 w-4" />, label: 'Belajar' },
            { to: '/playground', icon: <Code2 className="h-4 w-4" />, label: 'Playground' },
            { to: '/leaderboard', icon: <Trophy className="h-4 w-4" />, label: 'Papan Skor' },
            ...(isAuthenticated
              ? [
                  {
                    to: '/dashboard',
                    icon: <LayoutDashboard className="h-4 w-4" />,
                    label: 'Dashboard',
                  },
                ]
              : []),
          ].map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isAuthenticated && user ? (
            <div className="relative">
              {/* XP badge */}
              <div className="mr-1 hidden items-center gap-2 sm:flex">
                <span className="xp-badge">⚡ {formatXP(user.xpTotal)} XP</span>
                <span className="level-badge">Lv.{levelInfo?.level}</span>
              </div>

              {/* Avatar button */}
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="from-brand-400 to-brand-600 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    initials(user.displayName ?? user.username)
                  )}
                </div>
              </button>

              {/* User dropdown */}
              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="shadow-card-lg absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="border-b border-slate-100 p-3 dark:border-slate-800">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {user.displayName ?? user.username}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {user.email}
                        </p>
                      </div>
                      <div className="p-1">
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <User className="h-4 w-4" /> Profil Saya
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <LogOut className="h-4 w-4" /> Keluar
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Masuk
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Daftar
              </Button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-slate-200 bg-white md:hidden dark:border-slate-800 dark:bg-slate-950"
          >
            <nav className="flex flex-col gap-1 p-4">
              {[
                { to: '/courses', label: 'Belajar' },
                { to: '/playground', label: 'Playground' },
                { to: '/leaderboard', label: 'Papan Skor' },
                ...(isAuthenticated ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
              ].map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700'
                        : 'text-slate-600 dark:text-slate-400'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
