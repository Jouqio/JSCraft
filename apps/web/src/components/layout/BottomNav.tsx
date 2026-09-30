import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, Code2, Trophy, LayoutDashboard } from 'lucide-react';
import { cn } from '@lib/utils';

const ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Beranda' },
  { to: '/courses', icon: BookOpen, label: 'Belajar' },
  { to: '/playground', icon: Code2, label: 'Kode' },
  { to: '/leaderboard', icon: Trophy, label: 'Skor' },
];

/** Fixed bottom navigation bar -- visible only below 640px for authenticated users. */
export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t sm:hidden"
      style={{
        height: 'var(--bottom-nav-height)',
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-paper-card)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {ITEMS.map(({ to, icon: Icon, label }) => {
        const isActive = pathname === to || (to !== '/' && pathname.startsWith(to));
        return (
          <NavLink
            key={to}
            to={to}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
              isActive
                ? 'text-brand-600 dark:text-brand-400'
                : ''
            )}
            style={isActive ? undefined : { color: 'var(--color-ink-muted)' }}
          >
            <Icon className={cn('h-5 w-5', isActive && 'scale-110')} strokeWidth={isActive ? 2.5 : 2} />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
