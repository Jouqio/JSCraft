import { Helmet } from 'react-helmet-async';
import { BarChart2 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <>
      <Helmet><title>Analytics — Admin | JSCraft</title></Helmet>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-6">Analytics</h1>
        <div className="card p-10 text-center">
          <BarChart2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Dashboard analytics — Phase 2 implementation.</p>
          <p className="text-slate-400 text-sm mt-1">Akan menampilkan: DAU, lesson completion rates, heatmap aktivitas, XP distribution.</p>
        </div>
      </div>
    </>
  );
}
