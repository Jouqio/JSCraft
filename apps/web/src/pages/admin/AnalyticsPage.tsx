import { Helmet } from 'react-helmet-async';
import { BarChart2 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <>
      <Helmet>
        <title>Analytics — Admin | JSCraft</title>
      </Helmet>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="font-heading mb-6 text-xl font-bold text-slate-900 dark:text-white">
          Analytics
        </h1>
        <div className="card p-10 text-center">
          <BarChart2 className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
          <p className="text-slate-500 dark:text-slate-400">
            Dashboard analytics — Phase 2 implementation.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Akan menampilkan: DAU, lesson completion rates, heatmap aktivitas, XP distribution.
          </p>
        </div>
      </div>
    </>
  );
}
