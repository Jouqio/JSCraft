import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Award, CheckCircle, Code2 } from 'lucide-react';
import { api } from '@lib/api';
import { Spinner } from '@components/ui/Spinner';

interface CertData { username: string; displayName: string | null; courseSlug: string; issuedAt: string; verifyCode: string; }

export default function CertificatePage() {
  const { code } = useParams<{ code: string }>();
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    api.get(`/certificates/${code}`)
      .then(r => setCert(r.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner size="lg" /></div>;
  if (notFound || !cert) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <p className="text-slate-500 mb-2">Sertifikat tidak ditemukan atau kode tidak valid.</p>
        <p className="text-xs text-slate-400">Kode: {code}</p>
      </div>
    </div>
  );

  return (
    <>
      <Helmet><title>Sertifikat — {cert.displayName ?? cert.username} | JSCraft</title></Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-slate-50 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-brand-200 dark:border-brand-800 p-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Code2 className="w-6 h-6 text-brand-500" />
            <span className="font-heading font-bold text-xl text-slate-900 dark:text-white">JS<span className="text-brand-500">Craft</span></span>
          </div>
          <Award className="w-16 h-16 text-brand-500 mx-auto mb-5" />
          <p className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-widest font-semibold mb-2">Sertifikat Penyelesaian</p>
          <h1 className="font-heading text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            {cert.displayName ?? cert.username}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Telah berhasil menyelesaikan kursus
          </p>
          <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-2xl px-6 py-4 mb-6">
            <p className="font-heading font-bold text-lg text-brand-700 dark:text-brand-300">{cert.courseSlug}</p>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Diterbitkan pada {new Date(cert.issuedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
            <CheckCircle className="w-4 h-4" /> Sertifikat Terverifikasi
          </div>
          <p className="text-2xs text-slate-400 mt-3 font-mono">Kode verifikasi: {cert.verifyCode}</p>
        </div>
      </div>
    </>
  );
}
