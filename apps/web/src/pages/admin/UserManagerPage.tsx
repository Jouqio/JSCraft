import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Shield, User } from 'lucide-react';
import { apiGet } from '@lib/api';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { useDebounce } from '@hooks/useDebounce';
import { formatRelative } from '@lib/utils';

interface UserRow {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: string;
  xpTotal: number;
  level: number;
  isActive: boolean;
  createdAt: string;
}
interface Paginated {
  items: UserRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export default function UserManagerPage() {
  const [data, setData] = useState<Paginated | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const dSearch = useDebounce(search, 400);

  useEffect(() => {
    setLoading(true);
    apiGet<Paginated>(`/admin/users?page=${page}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, dSearch]);

  const items = Array.isArray(data?.items) ? data.items : [];
  const filtered = items.filter(
    (u) => !dSearch || u.email.includes(dSearch) || u.username.includes(dSearch)
  );

  return (
    <>
      <Helmet>
        <title>Kelola Pengguna — Admin | JSCraft</title>
      </Helmet>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
            Kelola Pengguna
          </h1>
          {data && <span className="text-sm text-slate-500">{data.total} pengguna</span>}
        </div>
        <Input
          placeholder="Cari email atau username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftAddon={<Search className="h-4 w-4" />}
          fullWidth
        />
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <tr>
                  {['Pengguna', 'Email', 'Role', 'XP / Level', 'Bergabung', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-3">
                        <div className="skeleton h-4 w-full rounded" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-slate-400">
                      Tidak ada pengguna ditemukan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-brand-100 dark:bg-brand-900/30 text-brand-600 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold">
                            {u.displayName?.[0]?.toUpperCase() ?? u.username[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {u.displayName ?? u.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === 'ADMIN' ? 'warning' : 'slate'}>
                          {u.role === 'ADMIN' ? (
                            <>
                              <Shield className="h-3 w-3" /> Admin
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3" /> Student
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="xp-badge">
                          ⚡{u.xpTotal} · Lv.{u.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {formatRelative(u.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.isActive ? 'success' : 'danger'}>
                          {u.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Hal. {page} dari {data.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-slate-700"
                >
                  ← Sebelumnya
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-slate-700"
                >
                  Berikutnya →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
