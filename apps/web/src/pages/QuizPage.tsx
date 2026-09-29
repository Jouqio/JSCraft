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
    apiGet<Quiz>(`/quiz/${id}`)
      .then(setQuiz)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  if (!quiz) return <div className="py-20 text-center text-slate-500">Kuis tidak ditemukan.</div>;

  return (
    <>
      <Helmet>
        <title>{quiz.title} — JSCraft</title>
      </Helmet>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link
          to="/courses"
          className="hover:text-brand-600 mb-6 flex items-center gap-1.5 text-sm text-slate-500 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Kembali ke Kursus
        </Link>
        <QuizBlock quiz={quiz} />
      </div>
    </>
  );
}
