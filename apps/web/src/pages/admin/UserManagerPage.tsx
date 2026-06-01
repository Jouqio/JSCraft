import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Shield, User } from 'lucide-react';
import { apiGet } from '@lib/api';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { useDebounce } from '@hooks/useDebounce';
import { formatRelative } from '@lib/utils';

interface UserRow { id: string; email: string; username: string; displayName: string | null; role: string; xpTotal: number; level: number; isActive: boolean; createdAt: string; }
interface Paginated { items: UserRow[]; total: number; page: number; perPage: number; totalPages: number; }

export default function UserManagerPage() {
  const [data, setData]   = useState<Paginated | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage]   = useState(1);
  const [loading, setLoading] = useState(true);
  const dSearch = useDebounce(search, 400);

  useEffect(() => {
    setLoading(true);
    apiGet<Paginated>(`/admin/users?page=${page}`)
      .then(setData).catch(console.error).finally(() => setLoading(false));
  }, [page, dSearch]);

  const filtered = data?.items.filter(u =>
    !dSearch || u.email.includes(dSearch) || u.username.includes(dSearch)
  ) ?? [];

  return (
    <>
      <Helmet><title>Kelola Pengguna — Admin | JSCraft</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-white">Kelola Pengguna</h1>
          {data && <span className="text-sm text-slate-500">{data.total} pengguna</span>}
        </div>
        <Input placeholder="Cari email atau username..." value={search} onChange={e => setSearch(e.target.value)}
          leftAddon={<Search className="w-4 h-4" />} fullWidth />
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {['Pengguna', 'Email', 'Role', 'XP / Level', 'Bergabung', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-4 rounded w-full" /></td></tr>
                )) : filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 text-xs font-bold">
                          {u.displayName?.[0]?.toUpperCase() ?? u.username[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{u.displayName ?? u.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === 'ADMIN' ? 'warning' : 'slate'}>
                        {u.role === 'ADMIN' ? <><Shield className="w-3 h-3" /> Admin</> : <><User className="w-3 h-3" /> Student</>}
                      </Badge>
                    </td>
                    <td className="px-4 py-3"><span className="xp-badge">⚡{u.xpTotal} · Lv.{u.level}</span></td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatRelative(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500">Hal. {page} dari {data.totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40">← Sebelumnya</button>
                <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40">Berikutnya →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
