import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Edit3, Check, X, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Note } from '@jscraft/types';
import { apiGet, apiPost, apiPatch, apiDel, ApiClientError } from '@lib/api';
import { useAuthStore } from '@store/authStore';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';

interface NotesPanelProps {
  lessonId: string;
}

const MAX_NOTE_LENGTH = 5000;
const MAX_NOTES_PER_LESSON = 50;

export default function NotesPanel({ lessonId }: NotesPanelProps) {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await apiGet<Note[]>(`/notes?lessonId=${lessonId}`);
      setNotes(data);
    } catch {
      toast.error('Gagal memuat catatan');
    } finally {
      setLoading(false);
    }
  }, [lessonId, user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    if (notes.length >= MAX_NOTES_PER_LESSON) {
      toast.error(`Maksimal ${MAX_NOTES_PER_LESSON} catatan per pelajaran`);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await apiPost<Note>('/notes', {
        lessonId,
        content: newContent.trim(),
      });
      setNotes((prev) => [created, ...prev]);
      setNewContent('');
      toast.success('Catatan berhasil ditambahkan');
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error('Gagal menyimpan catatan');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) {
      toast.error('Catatan tidak boleh kosong');
      return;
    }
    setIsUpdating(true);
    try {
      const updated = await apiPatch<Note>(`/notes/${id}`, {
        content: editContent.trim(),
      });
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      setEditingId(null);
      setEditContent('');
      toast.success('Catatan berhasil diperbarui');
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error('Gagal memperbarui catatan');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDel(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success('Catatan berhasil dihapus');
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error('Gagal menghapus catatan');
      }
    }
  };

  if (!user) {
    return (
      <div className="card p-6 text-center">
        <FileText className="mx-auto mb-3 h-8 w-8 text-slate-400" />
        <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">
          Masuk untuk Menulis Catatan
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Simpan ringkasan pribadi dan poin penting saat belajar pelajaran ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-slate-900 dark:text-white">
            Catatan Pribadi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hanya dapat diakses oleh akun Anda ({notes.length}/{MAX_NOTES_PER_LESSON})
          </p>
        </div>
      </div>

      {/* New Note Form */}
      <form onSubmit={handleCreateNote} className="card space-y-3 p-4">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          maxLength={MAX_NOTE_LENGTH}
          placeholder="Tulis catatan atau rangkuman materi di sini..."
          rows={3}
          className="focus:border-brand-500 w-full resize-none rounded-lg border border-slate-200 bg-transparent p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:border-slate-800 dark:text-white dark:placeholder-slate-500"
        />
        <div className="flex items-center justify-between">
          <span className="text-2xs text-slate-400">
            {newContent.length} / {MAX_NOTE_LENGTH} karakter
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={!newContent.trim() || isSubmitting}
            loading={isSubmitting}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Tambah Catatan
          </Button>
        </div>
      </form>

      {/* Notes List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-800">
          <FileText className="mx-auto mb-2 h-7 w-7 text-slate-400" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Belum ada catatan untuk pelajaran ini
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Gunakan form di atas untuk mencatat poin penting.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const isEditing = editingId === note.id;
            const formattedDate = new Date(note.updatedAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={note.id} className="card p-4 transition-all">
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      maxLength={MAX_NOTE_LENGTH}
                      rows={3}
                      className="focus:border-brand-500 w-full resize-none rounded-lg border border-slate-200 bg-transparent p-3 text-sm text-slate-900 focus:outline-none dark:border-slate-800 dark:text-white"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-2xs text-slate-400">
                        {editContent.length} / {MAX_NOTE_LENGTH} karakter
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={handleCancelEdit}
                          leftIcon={<X className="h-3.5 w-3.5" />}
                        >
                          Batal
                        </Button>
                        <Button
                          size="xs"
                          disabled={!editContent.trim() || isUpdating}
                          loading={isUpdating}
                          onClick={() => handleSaveEdit(note.id)}
                          leftIcon={<Check className="h-3.5 w-3.5" />}
                        >
                          Simpan
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                      {note.content}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800/60">
                      <span className="text-2xs text-slate-400 dark:text-slate-500">
                        {formattedDate}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(note)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                          title="Edit catatan"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(note.id)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Hapus catatan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
