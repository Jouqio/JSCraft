import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import type { Quiz } from '@jscraft/types';
import { apiGet } from '@lib/api';
import QuizBlock from '@components/lesson/QuizBlock';
import { Spinner } from '@components/ui/Spinner';
import { ChevronLeft } from 'lucide-react';

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiGet<Quiz>(`/quiz/${id}`).then(setQuiz).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  if (!quiz) return <div className="text-center py-20 text-slate-500">Kuis tidak ditemukan.</div>;

  return (
    <>
      <Helmet><title>{quiz.title} — JSCraft</title></Helmet>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/courses" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Kursus
        </Link>
        <QuizBlock quiz={quiz} />
      </div>
    </>
  );
}
