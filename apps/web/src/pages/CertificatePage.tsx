import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Award, CheckCircle, Code2 } from 'lucide-react';
import { api } from '@lib/api';
import { Spinner } from '@components/ui/Spinner';

interface CertData {
  username: string;
  displayName: string | null;
  courseSlug: string;
  issuedAt: string;
  verifyCode: string;
}

export default function CertificatePage() {
  const { code } = useParams<{ code: string }>();
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    api
      .get(`/certificates/${code}`)
      .then((r) => setCert(r.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  if (notFound || !cert)
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <p className="mb-2 text-slate-500">Sertifikat tidak ditemukan atau kode tidak valid.</p>
          <p className="text-xs text-slate-400">Kode: {code}</p>
        </div>
      </div>
    );

  return (
    <>
      <Helmet>
        <title>Sertifikat — {cert.displayName ?? cert.username} | JSCraft</title>
      </Helmet>
      <div className="from-brand-50 flex min-h-screen items-center justify-center bg-gradient-to-br to-slate-50 p-6 dark:from-slate-950 dark:to-slate-900">
        <div className="border-brand-200 dark:border-brand-800 w-full max-w-xl rounded-3xl border-2 bg-white p-10 text-center shadow-2xl dark:bg-slate-900">
          <div className="mb-8 flex items-center justify-center gap-2">
            <Code2 className="text-brand-500 h-6 w-6" />
            <span className="font-heading text-xl font-bold text-slate-900 dark:text-white">
              JS<span className="text-brand-500">Craft</span>
            </span>
          </div>
          <Award className="text-brand-500 mx-auto mb-5 h-16 w-16" />
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Sertifikat Penyelesaian
          </p>
          <h1 className="font-heading mb-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            {cert.displayName ?? cert.username}
          </h1>
          <p className="mb-6 text-slate-500 dark:text-slate-400">
            Telah berhasil menyelesaikan kursus
          </p>
          <div className="bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800 mb-6 rounded-2xl border px-6 py-4">
            <p className="font-heading text-brand-700 dark:text-brand-300 text-lg font-bold">
              {cert.courseSlug}
            </p>
          </div>
          <p className="mb-4 text-sm text-slate-400">
            Diterbitkan pada{' '}
            {new Date(cert.issuedAt).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4" /> Sertifikat Terverifikasi
          </div>
          <p className="text-2xs mt-3 font-mono text-slate-400">
            Kode verifikasi: {cert.verifyCode}
          </p>
        </div>
      </div>
    </>
  );
}
