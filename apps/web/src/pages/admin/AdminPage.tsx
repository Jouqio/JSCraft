import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Users, BookOpen, CheckSquare, Activity, Plus } from 'lucide-react';
import { apiGet } from '@lib/api';
import { Button } from '@components/ui/Button';

interface Stats {
  totalUsers: number;
  totalLessons: number;
  totalCompleted: number;
  activeToday: number;
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
      <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    apiGet<Stats>('/admin/stats').then(setStats).catch(console.error);
  }, []);

  return (
    <>
      <Helmet>
        <title>Admin Panel — JSCraft</title>
      </Helmet>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
              Admin Panel
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Kelola konten dan pengguna JSCraft
            </p>
          </div>
          <Link to="/admin/lessons/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Tambah Pelajaran</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-blue-600" />}
            label="Total Pengguna"
            value={stats?.totalUsers ?? '—'}
            color="bg-blue-100 dark:bg-blue-900/30"
          />
          <StatCard
            icon={<Activity className="h-5 w-5 text-emerald-600" />}
            label="Aktif Hari Ini"
            value={stats?.activeToday ?? '—'}
            color="bg-emerald-100 dark:bg-emerald-900/30"
          />
          <StatCard
            icon={<BookOpen className="text-brand-600 h-5 w-5" />}
            label="Total Pelajaran"
            value={stats?.totalLessons ?? '—'}
            color="bg-brand-100 dark:bg-brand-900/30"
          />
          <StatCard
            icon={<CheckSquare className="h-5 w-5 text-purple-600" />}
            label="Pelajaran Selesai"
            value={stats?.totalCompleted ?? '—'}
            color="bg-purple-100 dark:bg-purple-900/30"
          />
        </div>

        {/* Quick links */}
        <div>
          <h2 className="font-heading mb-4 font-bold text-slate-900 dark:text-white">
            Manajemen Konten
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                to: '/admin/users',
                icon: <Users className="h-6 w-6" />,
                title: 'Kelola Pengguna',
                desc: 'Lihat dan edit akun pengguna',
              },
              {
                to: '/admin/lessons/new',
                icon: <BookOpen className="h-6 w-6" />,
                title: 'Editor Pelajaran',
                desc: 'Buat dan edit konten pelajaran',
              },
              {
                to: '/admin/analytics',
                icon: <Activity className="h-6 w-6" />,
                title: 'Analytics',
                desc: 'Statistik penggunaan platform',
              },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="card-hover group p-5">
                <div className="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 group-hover:bg-brand-200 mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-colors">
                  {item.icon}
                </div>
                <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
