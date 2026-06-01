import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@components/ui/Button';

export default function NotFoundPage() {
  return (
    <>
      <Helmet><title>404 — Halaman Tidak Ditemukan | JSCraft</title></Helmet>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md">
          <div className="font-heading text-8xl font-extrabold gradient-text mb-4 select-none">404</div>
          <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Halaman tidak ditemukan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Sepertinya halaman yang kamu cari tidak ada, atau mungkin sudah dipindahkan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => window.history.back()} variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Kembali
            </Button>
            <Link to="/">
              <Button leftIcon={<Home className="w-4 h-4" />}>Ke Beranda</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
