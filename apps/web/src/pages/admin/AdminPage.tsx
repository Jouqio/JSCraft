import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Users, BookOpen, CheckSquare, Activity, Plus, Settings } from 'lucide-react';
import { apiGet } from '@lib/api';
import { Button } from '@components/ui/Button';

interface Stats { totalUsers: number; totalLessons: number; totalCompleted: number; activeToday: number; }

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>{icon}</div>
      <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => { apiGet<Stats>('/admin/stats').then(setStats).catch(console.error); }, []);

  return (
    <>
      <Helmet><title>Admin Panel — JSCraft</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Kelola konten dan pengguna JSCraft</p>
          </div>
          <Link to="/admin/lessons/new"><Button leftIcon={<Plus className="w-4 h-4" />}>Tambah Pelajaran</Button></Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Total Pengguna" value={stats?.totalUsers ?? '—'} color="bg-blue-100 dark:bg-blue-900/30" />
          <StatCard icon={<Activity className="w-5 h-5 text-emerald-600" />} label="Aktif Hari Ini" value={stats?.activeToday ?? '—'} color="bg-emerald-100 dark:bg-emerald-900/30" />
          <StatCard icon={<BookOpen className="w-5 h-5 text-brand-600" />} label="Total Pelajaran" value={stats?.totalLessons ?? '—'} color="bg-brand-100 dark:bg-brand-900/30" />
          <StatCard icon={<CheckSquare className="w-5 h-5 text-purple-600" />} label="Pelajaran Selesai" value={stats?.totalCompleted ?? '—'} color="bg-purple-100 dark:bg-purple-900/30" />
        </div>

        {/* Quick links */}
        <div>
          <h2 className="font-heading font-bold text-slate-900 dark:text-white mb-4">Manajemen Konten</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { to: '/admin/users',     icon: <Users className="w-6 h-6" />,     title: 'Kelola Pengguna',  desc: 'Lihat dan edit akun pengguna' },
              { to: '/admin/lessons/new',icon: <BookOpen className="w-6 h-6" />, title: 'Editor Pelajaran', desc: 'Buat dan edit konten pelajaran' },
              { to: '/admin/analytics', icon: <Activity className="w-6 h-6" />,  title: 'Analytics',        desc: 'Statistik penggunaan platform' },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="card-hover p-5 group">
                <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-3 group-hover:bg-brand-200 transition-colors">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
