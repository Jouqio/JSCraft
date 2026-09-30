import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Flame, Zap, BookOpen, Award } from 'lucide-react';
import { apiGet } from '@lib/api';
import { useAuthStore } from '@store/authStore';
import { xpService, formatXP } from '@lib/xp';
import { initials, formatRelative } from '@lib/utils';
import XPBar from '@components/dashboard/XPBar';
import ProgressRing from '@components/dashboard/ProgressRing';
import { Spinner } from '@components/ui/Spinner';

interface ProfileData {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  xpTotal: number;
  level: number;
  streakCurrent: number;
  streakMax: number;
  createdAt: string;
  achievements: Array<{
    achievement: { key: string; title: string; iconUrl: string; description: string };
    earnedAt: string;
  }>;
  certificates: Array<{ id: string; courseSlug: string; issuedAt: string; verifyCode: string }>;
  _count: { progress: number };
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useAuthStore();
  const target = username ?? me?.username ?? '';
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!target) return;
    apiGet<ProfileData>(`/profile/${target}`)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [target]);

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  if (!profile)
    return <div className="py-20 text-center text-slate-500">Profil tidak ditemukan.</div>;

  const completedLessons = profile._count?.progress ?? 0;
  const earnedAchs = Array.isArray(profile.achievements)
    ? profile.achievements.filter((a) => a.earnedAt)
    : [];

  return (
    <>
      <Helmet>
        <title>{profile.displayName ?? profile.username} — JSCraft</title>
      </Helmet>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        {/* Hero card */}
        <div className="card p-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="from-brand-400 to-brand-700 shadow-brand flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br text-2xl font-bold text-white">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="h-full w-full rounded-3xl object-cover"
                />
              ) : (
                initials(profile.displayName ?? profile.username)
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
                {profile.displayName ?? profile.username}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">@{profile.username}</p>
              <p className="mt-1 text-xs text-slate-400">
                Bergabung {formatRelative(profile.createdAt)}
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="level-badge">
                  Lv.{profile.level} — {xpService.levelTitle(profile.level)}
                </span>
                {profile.streakCurrent > 0 && (
                  <span className="streak-badge">
                    <Flame className="h-3 w-3" />
                    {profile.streakCurrent} hari
                  </span>
                )}
              </div>
            </div>
            {/* Progress ring */}
            <ProgressRing
              percent={Math.round((completedLessons / 42) * 100)}
              size={90}
              strokeWidth={7}
              label={`${completedLessons}`}
              sublabel="/ 42"
            />
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <XPBar xp={profile.xpTotal} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              icon: <Zap className="text-brand-500 h-4 w-4" />,
              label: 'Total XP',
              value: formatXP(profile.xpTotal) + ' XP',
            },
            {
              icon: <Flame className="h-4 w-4 text-orange-500" />,
              label: 'Streak Maks',
              value: profile.streakMax + ' hari',
            },
            {
              icon: <BookOpen className="h-4 w-4 text-blue-500" />,
              label: 'Pelajaran',
              value: `${completedLessons}/42`,
            },
            {
              icon: <Award className="h-4 w-4 text-purple-500" />,
              label: 'Pencapaian',
              value: earnedAchs.length.toString(),
            },
          ].map(({ icon, label, value }) => (
            <div key={label} className="card p-4 text-center">
              <div className="mb-1 flex justify-center">{icon}</div>
              <div className="font-heading font-bold text-slate-900 dark:text-white">{value}</div>
              <div className="text-2xs mt-0.5 text-slate-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        {earnedAchs.length > 0 && (
          <div>
            <h2 className="font-heading mb-3 font-bold text-slate-900 dark:text-white">
              Pencapaian
            </h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {earnedAchs.map(({ achievement }) => (
                <motion.div
                  key={achievement.key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card p-3 text-center"
                  title={`${achievement.title} — ${achievement.description}`}
                >
                  <div className="mb-1 text-2xl">{achievement.iconUrl}</div>
                  <div className="text-2xs font-medium leading-tight text-slate-600 dark:text-slate-400">
                    {achievement.title}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Certificates */}
        {profile.certificates.length > 0 && (
          <div>
            <h2 className="font-heading mb-3 font-bold text-slate-900 dark:text-white">
              Sertifikat
            </h2>
            <div className="space-y-2">
              {profile.certificates.map((cert) => (
                <div key={cert.id} className="card flex items-center gap-4 p-4">
                  <Award className="text-brand-500 h-8 w-8 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {cert.courseSlug}
                    </div>
                    <div className="text-2xs mt-0.5 text-slate-400">
                      Diterbitkan{' '}
                      {new Date(cert.issuedAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <a
                    href={`/certificates/${cert.verifyCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 dark:text-brand-400 shrink-0 text-xs hover:underline"
                  >
                    Verifikasi →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
