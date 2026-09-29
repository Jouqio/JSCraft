import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@components/ui/Button';

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>404 — Halaman Tidak Ditemukan | JSCraft</title>
      </Helmet>
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <div className="font-heading gradient-text mb-4 select-none text-8xl font-extrabold">
            404
          </div>
          <h1 className="font-heading mb-2 text-2xl font-bold text-slate-900 dark:text-white">
            Halaman tidak ditemukan
          </h1>
          <p className="mb-8 text-slate-500 dark:text-slate-400">
            Sepertinya halaman yang kamu cari tidak ada, atau mungkin sudah dipindahkan.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Kembali
            </Button>
            <Link to="/">
              <Button leftIcon={<Home className="h-4 w-4" />}>Ke Beranda</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
