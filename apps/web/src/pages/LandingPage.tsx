import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, Zap, Trophy, BookOpen, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@components/ui/Button';
import { useAuthStore } from '@store/authStore';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

const FEATURES = [
  {
    icon: <Code2 className="h-5 w-5" />,
    title: 'Live Code Editor',
    desc: 'Tulis dan jalankan JavaScript langsung di browser. Output instan, error jelas.',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Sistem XP & Level',
    desc: 'Kumpulkan XP di setiap pelajaran, naik level, dan pertahankan streak harian.',
  },
  {
    icon: <Trophy className="h-5 w-5" />,
    title: 'Kuis Interaktif',
    desc: 'Uji pemahaman dengan kuis multiple-choice dan feedback langsung di setiap pelajaran.',
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: '42 Hari Terstruktur',
    desc: '6 minggu kurikulum dari Hello World hingga Proyek nyata. Satu langkah setiap harinya.',
  },
  {
    icon: <CheckCircle className="h-5 w-5" />,
    title: 'Sertifikat Verifiable',
    desc: 'Dapatkan sertifikat dengan kode verifikasi unik setelah menyelesaikan kursus.',
  },
  {
    icon: <Star className="h-5 w-5" />,
    title: 'Gamifikasi Penuh',
    desc: 'Badge pencapaian, papan skor, streak harian — belajar terasa seperti bermain.',
  },
];

const ROADMAP = [
  {
    phase: 'Fase 1',
    weeks: 'Minggu 1–2',
    title: 'Fondasi JavaScript',
    topics: [
      'Variabel & Tipe Data',
      'Operator & Ekspresi',
      'Kontrol Alur',
      'Loop',
      'Fungsi',
      'Proyek Kalkulator',
    ],
  },
  {
    phase: 'Fase 2',
    weeks: 'Minggu 3–4',
    title: 'JavaScript Menengah',
    topics: [
      'Array & Methods',
      'Object & Prototype',
      'DOM Manipulation',
      'Events',
      'Async/Await',
      'Fetch API',
    ],
  },
  {
    phase: 'Fase 3',
    weeks: 'Minggu 5–6',
    title: 'JavaScript Modern',
    topics: ['ES6+ Features', 'OOP di JS', 'Error Handling', 'Modules', 'Proyek Akhir', 'Deploy'],
  },
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
      <section className="relative overflow-hidden bg-white pb-24 pt-16 dark:bg-slate-950">
        {/* Background grid */}
        <div className="bg-hero-grid absolute inset-0 opacity-60 dark:opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-slate-950" />

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp}>
              <span className="bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold">
                <span className="bg-brand-500 animate-pulse-soft h-2 w-2 rounded-full" />
                42 Hari · Bahasa Indonesia · Gratis Selamanya
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-heading mb-6 text-balance text-4xl font-extrabold text-slate-900 sm:text-5xl lg:text-6xl dark:text-white"
            >
              Belajar <span className="gradient-text">JavaScript</span>
              <br />
              dari Nol ke Siap Kerja
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mb-10 max-w-2xl text-pretty text-lg text-slate-600 sm:text-xl dark:text-slate-400"
            >
              Platform interaktif dengan live code editor, kuis bergamifikasi, dan kurikulum 42 hari
              terstruktur. Dari Hello World hingga proyek nyata satu hari satu langkah.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col justify-center gap-3 sm:flex-row"
            >
              <Button
                size="lg"
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                rightIcon={<ArrowRight className="h-5 w-5" />}
                className="shadow-brand-lg"
              >
                {isAuthenticated ? 'Lanjutkan Belajar' : 'Mulai Gratis Sekarang'}
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/courses')}>
                Lihat Kurikulum
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={fadeUp}
              className="mt-12 flex flex-wrap items-center justify-center gap-8"
            >
              {[
                ['42', 'Hari Belajar'],
                ['150+', 'Latihan Kode'],
                ['6', 'Proyek Nyata'],
                ['Free', 'Selamanya'],
              ].map(([val, label]) => (
                <div key={label} className="text-center">
                  <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
                    {val}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero code preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mx-auto mt-16 max-w-2xl overflow-hidden rounded-2xl border border-slate-200 text-left shadow-2xl dark:border-slate-700"
          >
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <span className="ml-2 font-mono text-xs text-slate-400">hello.js</span>
            </div>
            <div className="bg-code-surface p-6 font-mono text-sm leading-relaxed">
              <div>
                <span className="text-purple-400">const</span>{' '}
                <span className="text-blue-300">sapa</span> <span className="text-white">= (</span>
                <span className="text-orange-300">nama</span>
                <span className="text-white">) =&gt; {`{`}</span>
              </div>
              <div className="pl-6">
                <span className="text-purple-400">return</span>{' '}
                <span className="text-green-400">
                  `Halo, <span className="text-orange-300">${`{nama}`}</span>! Selamat belajar
                  JavaScript 🚀`
                </span>
                <span className="text-white">;</span>
              </div>
              <div>
                <span className="text-white">{`}`};</span>
              </div>
              <div className="mt-2">
                <span className="text-blue-400">console</span>
                <span className="text-white">.</span>
                <span className="text-yellow-300">log</span>
                <span className="text-white">(</span>
                <span className="text-blue-300">sapa</span>
                <span className="text-white">(</span>
                <span className="text-green-400">&quot;Budi&quot;</span>
                <span className="text-white">));</span>
              </div>
              <div className="mt-3 text-slate-500">
                {'// '}
                <span className="text-emerald-400">Halo, Budi! Selamat belajar JavaScript</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="bg-slate-50 py-24 dark:bg-slate-900/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="heading-2 mb-4 text-slate-900 dark:text-white">
              Semua yang kamu butuhkan untuk belajar
            </h2>
            <p className="mx-auto max-w-xl text-slate-600 dark:text-slate-400">
              Dirancang dari awal untuk membuat belajar JavaScript terasa menyenangkan dan efektif.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card hover:shadow-card-md p-6 transition-all duration-200"
              >
                <div className="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 mb-4 flex h-10 w-10 items-center justify-center rounded-xl">
                  {f.icon}
                </div>
                <h3 className="font-heading mb-2 font-semibold text-slate-900 dark:text-white">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roadmap ───────────────────────────────────────── */}
      <section className="bg-white py-24 dark:bg-slate-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <h2 className="heading-2 mb-4 text-slate-900 dark:text-white">Kurikulum 42 Hari</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Terstruktur dari dasar hingga siap pakai di dunia kerja.
            </p>
          </div>
          <div className="space-y-6">
            {ROADMAP.map((phase, i) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="card flex gap-6 p-6"
              >
                <div className="bg-brand-500 font-heading flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-center text-sm font-bold leading-tight text-white">
                  {phase.phase.split(' ').map((w, j) => (
                    <div key={j}>{w}</div>
                  ))}
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="font-heading font-semibold text-slate-900 dark:text-white">
                      {phase.title}
                    </h3>
                    <span className="tag">{phase.weeks}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {phase.topics.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="from-brand-500 to-brand-700 bg-gradient-to-br py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="font-heading mb-4 text-3xl font-extrabold text-white sm:text-4xl">
            Siap mulai perjalananmu?
          </h2>
          <p className="text-brand-100 mb-8 text-lg">
            Bergabung sekarang gratis, tanpa kartu kredit, mulai kapan saja.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate(isAuthenticated ? '/courses' : '/register')}
            rightIcon={<ArrowRight className="h-5 w-5" />}
          >
            {isAuthenticated ? 'Lanjutkan Belajar' : 'Daftar Sekarang — Gratis'}
          </Button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Code2 className="text-brand-500 h-5 w-5" />
            <span className="font-heading font-bold text-slate-900 dark:text-white">
              JS<span className="text-brand-500">Craft</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} JSCraft. Dibuat dengan ❤️ untuk pelajar Indonesia.
          </p>
        </div>
      </footer>
    </>
  );
}
