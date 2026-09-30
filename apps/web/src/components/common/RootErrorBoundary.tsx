import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@components/ui/Button';

export default function RootErrorBoundary() {
  const error = useRouteError();

  let errorMessage: string = 'Terjadi kesalahan internal pada aplikasi.';
  let statusCode = 500;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    const dataMsg =
      typeof error.data === 'object' && error.data !== null && 'message' in error.data
        ? String((error.data as { message: unknown }).message)
        : typeof error.data === 'string'
          ? error.data
          : '';
    errorMessage = String(error.statusText || dataMsg || 'Galat respons rute');
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = String(error ?? 'Terjadi kesalahan internal pada aplikasi.');
  }

  const isDev = import.meta.env.DEV;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40">
          <AlertCircle className="h-7 w-7 text-rose-600 dark:text-rose-400" aria-hidden="true" />
        </div>

        <h1 className="font-heading mb-2 text-xl font-bold text-slate-900 dark:text-white">
          Terjadi Kendala pada Aplikasi
        </h1>

        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          {statusCode === 404
            ? 'Halaman atau data yang Anda tuju tidak ditemukan.'
            : 'Halaman ini mengalami kendala teknis saat memuat data atau merender tampilan. Silakan coba muat ulang atau kembali ke beranda.'}
        </p>

        {isDev && Boolean(error) ? (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-3 text-left font-mono text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <div className="mb-1 font-semibold">Pesan Galat (Mode Pengembangan):</div>
            <div className="break-all">{errorMessage}</div>
            {error instanceof Error && error.stack ? (
              <pre className="mt-2 max-h-32 overflow-auto text-[10px] leading-tight text-slate-600 dark:text-slate-400">
                {error.stack}
              </pre>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            variant="primary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => window.location.reload()}
          >
            Muat Ulang
          </Button>
          <Link to="/">
            <Button
              variant="outline"
              leftIcon={<Home className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
