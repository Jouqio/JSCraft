import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Save, ArrowLeft } from 'lucide-react';
import { api } from '@lib/api';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import toast from 'react-hot-toast';

export default function LessonEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', titleId: '', slug: '', type: 'THEORY', dayNumber: 1, xpReward: 10, starterCode: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) await api.post('/admin/lessons', form);
      else await api.patch(`/admin/lessons/${id}`, form);
      toast.success('Pelajaran disimpan!');
      navigate('/admin');
    } catch { toast.error('Gagal menyimpan.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Helmet><title>{isNew ? 'Tambah Pelajaran' : 'Edit Pelajaran'} — Admin | JSCraft</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <Button onClick={handleSave} loading={saving} leftIcon={<Save className="w-4 h-4" />}>Simpan Pelajaran</Button>
        </div>
        <div className="card p-6 space-y-4">
          <h1 className="font-heading font-bold text-lg text-slate-900 dark:text-white">{isNew ? 'Tambah Pelajaran Baru' : 'Edit Pelajaran'}</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Judul (English)" value={form.title} onChange={set('title')} fullWidth />
            <Input label="Judul (Indonesia)" value={form.titleId} onChange={set('titleId')} fullWidth />
            <Input label="Slug" value={form.slug} onChange={set('slug')} hint="e.g. hello-world" fullWidth />
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Tipe</label>
              <select value={form.type} onChange={set('type')}
                className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm">
                <option value="THEORY">Teori</option>
                <option value="PRACTICE">Praktik</option>
                <option value="PROJECT">Proyek</option>
              </select>
            </div>
            <Input label="Hari ke-" type="number" value={String(form.dayNumber)} onChange={set('dayNumber')} fullWidth />
            <Input label="XP Reward" type="number" value={String(form.xpReward)} onChange={set('xpReward')} fullWidth />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Starter Code</label>
            <textarea value={form.starterCode} onChange={e => setForm(f => ({ ...f, starterCode: e.target.value }))} rows={8}
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 text-slate-200 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
      </div>
    </>
  );
}
