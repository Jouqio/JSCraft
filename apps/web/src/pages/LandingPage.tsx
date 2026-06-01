import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, Zap, Trophy, BookOpen, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@components/ui/Button';
import { useAuthStore } from '@store/authStore';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

const FEATURES = [
  { icon: <Code2 className="w-5 h-5" />, title: 'Live Code Editor', desc: 'Tulis dan jalankan JavaScript langsung di browser. Output instan, error jelas.' },
  { icon: <Zap className="w-5 h-5" />, title: 'Sistem XP & Level', desc: 'Kumpulkan XP di setiap pelajaran, naik level, dan pertahankan streak harian.' },
  { icon: <Trophy className="w-5 h-5" />, title: 'Kuis Interaktif', desc: 'Uji pemahaman dengan kuis multiple-choice dan feedback langsung di setiap pelajaran.' },
  { icon: <BookOpen className="w-5 h-5" />, title: '42 Hari Terstruktur', desc: '6 minggu kurikulum dari Hello World hingga Proyek nyata. Satu langkah setiap harinya.' },
  { icon: <CheckCircle className="w-5 h-5" />, title: 'Sertifikat Verifiable', desc: 'Dapatkan sertifikat dengan kode verifikasi unik setelah menyelesaikan kursus.' },
  { icon: <Star className="w-5 h-5" />, title: 'Gamifikasi Penuh', desc: 'Badge pencapaian, papan skor, streak harian — belajar terasa seperti bermain.' },
];

const ROADMAP = [
  { phase: 'Fase 1', weeks: 'Minggu 1–2', title: 'Fondasi JavaScript', topics: ['Variabel & Tipe Data', 'Operator & Ekspresi', 'Kontrol Alur', 'Loop', 'Fungsi', 'Proyek Kalkulator'] },
  { phase: 'Fase 2', weeks: 'Minggu 3–4', title: 'JavaScript Menengah', topics: ['Array & Methods', 'Object & Prototype', 'DOM Manipulation', 'Events', 'Async/Await', 'Fetch API'] },
  { phase: 'Fase 3', weeks: 'Minggu 5–6', title: 'JavaScript Modern', topics: ['ES6+ Features', 'OOP di JS', 'Error Handling', 'Modules', 'Proyek Akhir', 'Deploy'] },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Helmet>
        <title>JSCraft — Belajar JavaScript dari Nol ke Siap Kerja</title>
      </Helmet>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-950 pt-16 pb-24">
        {/* Background grid */}
        <div className="absolute inset-0 bg-hero-grid opacity-60 dark:opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-slate-950" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-soft" />
                42 Hari · Bahasa Indonesia · Gratis Selamanya
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 text-balance">
              Belajar{' '}
              <span className="gradient-text">JavaScript</span>
              <br />dari Nol ke Siap Kerja
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 text-pretty">
              Platform interaktif dengan live code editor, kuis bergamifikasi, dan kurikulum 42 hari terstruktur.
              Dari Hello World hingga proyek nyata — satu hari satu langkah.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="shadow-brand-lg">
                {isAuthenticated ? 'Lanjutkan Belajar' : 'Mulai Gratis Sekarang'}
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/courses')}>
                Lihat Kurikulum
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={fadeUp} className="mt-12 flex items-center justify-center gap-8 flex-wrap">
              {[['42', 'Hari Belajar'], ['150+', 'Latihan Kode'], ['6', 'Proyek Nyata'], ['Free', 'Selamanya']].map(([val, label]) => (
                <div key={label} className="text-center">
                  <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white">{val}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero code preview */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 text-left max-w-2xl mx-auto">
            <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-slate-400 text-xs font-mono ml-2">hello.js</span>
            </div>
            <div className="bg-code-surface p-6 font-mono text-sm leading-relaxed">
              <div><span className="text-purple-400">const</span> <span className="text-blue-300">sapa</span> <span className="text-white">= (</span><span className="text-orange-300">nama</span><span className="text-white">) =&gt; {`{`}</span></div>
              <div className="pl-6"><span className="text-purple-400">return</span> <span className="text-green-400">`Halo, <span className="text-orange-300">${`{nama}`}</span>! Selamat belajar JavaScript 🚀`</span><span className="text-white">;</span></div>
              <div><span className="text-white">{`}`};</span></div>
              <div className="mt-2"><span className="text-blue-400">console</span><span className="text-white">.</span><span className="text-yellow-300">log</span><span className="text-white">(</span><span className="text-blue-300">sapa</span><span className="text-white">(</span><span className="text-green-400">"Budi"</span><span className="text-white">));</span></div>
              <div className="mt-3 text-slate-500">{'// '}<span className="text-emerald-400">Halo, Budi! Selamat belajar JavaScript 🚀</span></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="heading-2 text-slate-900 dark:text-white mb-4">Semua yang kamu butuhkan untuk belajar</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">Dirancang dari awal untuk membuat belajar JavaScript terasa menyenangkan dan efektif.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="card p-6 hover:shadow-card-md transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
                  {f.icon}
                </div>
                <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roadmap ───────────────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="heading-2 text-slate-900 dark:text-white mb-4">Kurikulum 42 Hari</h2>
            <p className="text-slate-600 dark:text-slate-400">Terstruktur dari dasar hingga siap pakai di dunia kerja.</p>
          </div>
          <div className="space-y-6">
            {ROADMAP.map((phase, i) => (
              <motion.div key={phase.phase} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="card p-6 flex gap-6">
                <div className="shrink-0 w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-heading font-bold text-sm text-center leading-tight">
                  {phase.phase.split(' ').map((w, j) => <div key={j}>{w}</div>)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-heading font-semibold text-slate-900 dark:text-white">{phase.title}</h3>
                    <span className="tag">{phase.weeks}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {phase.topics.map((t) => (
                      <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{t}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-brand-500 to-brand-700">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Siap mulai perjalananmu?
          </h2>
          <p className="text-brand-100 text-lg mb-8">
            Bergabung sekarang — gratis, tanpa kartu kredit, mulai kapan saja.
          </p>
          <Button size="lg" variant="secondary"
            onClick={() => navigate(isAuthenticated ? '/courses' : '/register')}
            rightIcon={<ArrowRight className="w-5 h-5" />}>
            {isAuthenticated ? 'Lanjutkan Belajar' : 'Daftar Sekarang — Gratis'}
          </Button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="py-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-brand-500" />
            <span className="font-heading font-bold text-slate-900 dark:text-white">JS<span className="text-brand-500">Craft</span></span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} JSCraft. Dibuat dengan ❤️ untuk pelajar Indonesia.
          </p>
        </div>
      </footer>
    </>
  );
}
