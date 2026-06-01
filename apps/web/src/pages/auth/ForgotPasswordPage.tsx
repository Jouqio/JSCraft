import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Code2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { api } from '@lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Gagal mengirim email. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Lupa Password — JSCraft</title></Helmet>
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="w-full max-w-sm">
          <Link to="/login" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Login
          </Link>
          <div className="card p-8">
            <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-6">
              {sent ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : <Mail className="w-6 h-6 text-brand-600 dark:text-brand-400" />}
            </div>
            {sent ? (
              <>
                <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-2">Email terkirim!</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Cek inbox <strong>{email}</strong> untuk link reset password. Jika tidak ada, cek folder spam.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-1">Lupa Password</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Masukkan email akunmu dan kami akan kirimkan link untuk reset password.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input label="Email" type="email" placeholder="nama@email.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftAddon={<Mail className="w-4 h-4" />} fullWidth />
                  <Button type="submit" loading={loading} fullWidth>Kirim Link Reset</Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
