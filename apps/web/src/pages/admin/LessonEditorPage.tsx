import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Save, ArrowLeft } from 'lucide-react';
import { apiPost, apiPatch } from '@lib/api';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import toast from 'react-hot-toast';

export default function LessonEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    titleId: '',
    slug: '',
    type: 'THEORY',
    dayNumber: 1,
    xpReward: 10,
    starterCode: '',
  });

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) await apiPost('/admin/lessons', form);
      else await apiPatch(`/admin/lessons/${id}`, form);
      toast.success('Pelajaran disimpan!');
      navigate('/admin');
    } catch {
      toast.error('Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{isNew ? 'Tambah Pelajaran' : 'Edit Pelajaran'} — Admin | JSCraft</title>
      </Helmet>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>
          <Button onClick={handleSave} loading={saving} leftIcon={<Save className="h-4 w-4" />}>
            Simpan Pelajaran
          </Button>
        </div>
        <div className="card space-y-4 p-6">
          <h1 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
            {isNew ? 'Tambah Pelajaran Baru' : 'Edit Pelajaran'}
          </h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Judul (English)" value={form.title} onChange={set('title')} fullWidth />
            <Input
              label="Judul (Indonesia)"
              value={form.titleId}
              onChange={set('titleId')}
              fullWidth
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={set('slug')}
              hint="e.g. hello-world"
              fullWidth
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Tipe
              </label>
              <select
                value={form.type}
                onChange={set('type')}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="THEORY">Teori</option>
                <option value="PRACTICE">Praktik</option>
                <option value="PROJECT">Proyek</option>
              </select>
            </div>
            <Input
              label="Hari ke-"
              type="number"
              value={String(form.dayNumber)}
              onChange={set('dayNumber')}
              fullWidth
            />
            <Input
              label="XP Reward"
              type="number"
              value={String(form.xpReward)}
              onChange={set('xpReward')}
              fullWidth
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Starter Code
            </label>
            <textarea
              value={form.starterCode}
              onChange={(e) => setForm((f) => ({ ...f, starterCode: e.target.value }))}
              rows={8}
              className="focus:ring-brand-500 block w-full rounded-xl border border-slate-300 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-200 focus:outline-none focus:ring-2 dark:border-slate-700"
            />
          </div>
        </div>
      </div>
    </>
  );
}
