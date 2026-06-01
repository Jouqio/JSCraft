import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Code2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useAuthStore } from '@store/authStore';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { loginSchema, type LoginInput } from '@lib/validators';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';

  const [form, setForm] = useState<LoginInput>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<LoginInput>>({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<LoginInput> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as keyof LoginInput;
        fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Selamat datang kembali! 👋');
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? 'Login gagal. Coba lagi.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Masuk — JSCraft</title></Helmet>
      <div className="min-h-screen flex">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-code-surface flex-col justify-center items-center p-12">
          <div className="max-w-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-6 shadow-brand-lg">
              <Code2 className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="font-heading text-3xl font-bold text-white mb-4">
              Lanjutkan perjalanan belajarmu
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Login untuk melanjutkan progress, kuis, dan streak harianmu.
            </p>
            <div className="mt-8 rounded-xl overflow-hidden border border-slate-700 text-left">
              <div className="bg-slate-800 px-4 py-2 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
              <div className="bg-slate-900 p-4 font-mono text-sm leading-loose">
                <div><span className="text-purple-400">const</span> <span className="text-blue-300">kamu</span> <span className="text-white">= {`{`}</span></div>
                <div className="pl-4"><span className="text-slate-400">level:</span> <span className="text-orange-300">5</span><span className="text-white">,</span></div>
                <div className="pl-4"><span className="text-slate-400">streak:</span> <span className="text-orange-300">7</span><span className="text-white">,</span></div>
                <div className="pl-4"><span className="text-slate-400">xp:</span> <span className="text-orange-300">1250</span><span className="text-white">,</span></div>
                <div><span className="text-white">{`}`};</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-slate-950">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="mb-8">
              <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
                <Code2 className="w-6 h-6 text-brand-500" />
                <span className="font-heading font-bold text-slate-900 dark:text-white">JS<span className="text-brand-500">Craft</span></span>
              </Link>
              <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-1">Masuk ke JSCraft</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Belum punya akun?{' '}
                <Link to="/register" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">Daftar gratis</Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email" type="email" placeholder="nama@email.com"
                value={form.email} error={errors.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                leftAddon={<Mail className="w-4 h-4" />} fullWidth />

              <Input label="Password" type={showPass ? 'text' : 'password'} placeholder="Password kamu"
                value={form.password} error={errors.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                leftAddon={<Lock className="w-4 h-4" />}
                rightAddon={
                  <button type="button" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                } fullWidth />

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                  Lupa password?
                </Link>
              </div>

              <Button type="submit" loading={loading} fullWidth size="lg">
                Masuk
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Demo Account</p>
              <button type="button" onClick={() => setForm({ email: 'budi@example.com', password: 'Student@123' })}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                budi@example.com / Student@123
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
