import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AtSign, Eye, EyeOff, Code2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useAuthStore } from '@store/authStore';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { registerSchema, type RegisterInput } from '@lib/validators';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fe: Partial<typeof form> = {};
      result.error.errors.forEach((err) => { fe[err.path[0] as keyof typeof form] = err.message; });
      setErrors(fe);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register({ email: form.email, username: form.username, password: form.password, displayName: form.displayName });
      toast.success('Akun berhasil dibuat! Selamat belajar 🎉');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = passwordStrength(form.password);
  const strengthLabel = ['', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-emerald-500'][strength];

  return (
    <>
      <Helmet><title>Daftar — JSCraft</title></Helmet>
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="card p-8">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-lg text-slate-900 dark:text-white">
                JS<span className="text-brand-500">Craft</span>
              </span>
            </div>

            <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Buat akun gratis
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">Masuk</Link>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nama Lengkap" placeholder="Budi Santoso" value={form.displayName}
                error={errors.displayName} onChange={set('displayName')}
                leftAddon={<User className="w-4 h-4" />} fullWidth />
              <Input label="Username" placeholder="budi_dev" value={form.username}
                error={errors.username} onChange={set('username')}
                leftAddon={<AtSign className="w-4 h-4" />}
                hint="Huruf kecil, angka, - dan _ saja" fullWidth />
              <Input label="Email" type="email" placeholder="nama@email.com" value={form.email}
                error={errors.email} onChange={set('email')}
                leftAddon={<Mail className="w-4 h-4" />} fullWidth />

              <div>
                <Input label="Password" type={showPass ? 'text' : 'password'} placeholder="Min. 8 karakter" value={form.password}
                  error={errors.password} onChange={set('password')}
                  leftAddon={<Lock className="w-4 h-4" />}
                  rightAddon={<button type="button" onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} fullWidth />
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-slate-200 dark:bg-slate-700'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">{strengthLabel}</p>
                  </div>
                )}
              </div>

              <Input label="Konfirmasi Password" type={showPass ? 'text' : 'password'} placeholder="Ulangi password"
                value={form.confirmPassword} error={errors.confirmPassword} onChange={set('confirmPassword')}
                leftAddon={<Lock className="w-4 h-4" />} fullWidth />

              <Button type="submit" loading={loading} fullWidth size="lg">
                Buat Akun — Gratis
              </Button>

              <p className="text-xs text-center text-slate-400">
                Dengan mendaftar, kamu menyetujui{' '}
                <Link to="/terms" className="underline hover:text-brand-500">Syarat & Ketentuan</Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
}
