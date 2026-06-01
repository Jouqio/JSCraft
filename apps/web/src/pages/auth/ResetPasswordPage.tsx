import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { api } from '@lib/api';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Password tidak cocok'); return; }
    if (password.length < 8) { toast.error('Password minimal 8 karakter'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password berhasil direset! Silakan login.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'Gagal reset password.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Helmet><title>Reset Password — JSCraft</title></Helmet>
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="w-full max-w-sm card p-8">
          <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-1">Buat Password Baru</h1>
          <p className="text-sm text-slate-500 mb-6">Minimal 8 karakter, kombinasi huruf kapital dan angka.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Password Baru" type={show ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftAddon={<Lock className="w-4 h-4" />}
              rightAddon={<button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} fullWidth />
            <Input label="Konfirmasi Password" type={show ? 'text' : 'password'} value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              leftAddon={<Lock className="w-4 h-4" />} fullWidth />
            <Button type="submit" loading={loading} fullWidth>Reset Password</Button>
          </form>
        </div>
      </div>
    </>
  );
}
