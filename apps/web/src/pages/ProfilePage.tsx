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
  id: string; username: string; displayName: string | null; avatarUrl: string | null;
  xpTotal: number; level: number; streakCurrent: number; streakMax: number; createdAt: string;
  achievements: Array<{ achievement: { key: string; title: string; iconUrl: string; description: string }; earnedAt: string }>;
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
      .then(setProfile).catch(console.error).finally(() => setLoading(false));
  }, [target]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  if (!profile) return <div className="text-center py-20 text-slate-500">Profil tidak ditemukan.</div>;

  const levelInfo = xpService.levelFromXP(profile.xpTotal);
  const completedLessons = profile._count.progress;
  const earnedAchs = profile.achievements.filter(a => a.earnedAt);

  return (
    <>
      <Helmet><title>{profile.displayName ?? profile.username} — JSCraft</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Hero card */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center text-white text-2xl font-bold shadow-brand shrink-0">
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt="" className="w-full h-full rounded-3xl object-cover" />
                : initials(profile.displayName ?? profile.username)
              }
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
                {profile.displayName ?? profile.username}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">@{profile.username}</p>
              <p className="text-xs text-slate-400 mt-1">Bergabung {formatRelative(profile.createdAt)}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                <span className="level-badge">Lv.{profile.level} — {xpService.levelTitle(profile.level)}</span>
                {profile.streakCurrent > 0 && (
                  <span className="streak-badge"><Flame className="w-3 h-3" />{profile.streakCurrent} hari</span>
                )}
              </div>
            </div>
            {/* Progress ring */}
            <ProgressRing percent={Math.round((completedLessons / 42) * 100)} size={90} strokeWidth={7}
              label={`${completedLessons}`} sublabel="/ 42" />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <XPBar xp={profile.xpTotal} />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <Zap className="w-4 h-4 text-brand-500" />,   label: 'Total XP',      value: formatXP(profile.xpTotal) + ' XP' },
            { icon: <Flame className="w-4 h-4 text-orange-500" />, label: 'Streak Maks',  value: profile.streakMax + ' hari' },
            { icon: <BookOpen className="w-4 h-4 text-blue-500" />,label: 'Pelajaran',    value: `${completedLessons}/42` },
            { icon: <Award className="w-4 h-4 text-purple-500" />, label: 'Pencapaian',   value: earnedAchs.length.toString() },
          ].map(({ icon, label, value }) => (
            <div key={label} className="card p-4 text-center">
              <div className="flex justify-center mb-1">{icon}</div>
              <div className="font-heading font-bold text-slate-900 dark:text-white">{value}</div>
              <div className="text-2xs text-slate-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        {earnedAchs.length > 0 && (
          <div>
            <h2 className="font-heading font-bold text-slate-900 dark:text-white mb-3">Pencapaian</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {earnedAchs.map(({ achievement, earnedAt }) => (
                <motion.div key={achievement.key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="card p-3 text-center" title={`${achievement.title} — ${achievement.description}`}>
                  <div className="text-2xl mb-1">{achievement.iconUrl}</div>
                  <div className="text-2xs font-medium text-slate-600 dark:text-slate-400 leading-tight">{achievement.title}</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Certificates */}
        {profile.certificates.length > 0 && (
          <div>
            <h2 className="font-heading font-bold text-slate-900 dark:text-white mb-3">Sertifikat</h2>
            <div className="space-y-2">
              {profile.certificates.map((cert) => (
                <div key={cert.id} className="card p-4 flex items-center gap-4">
                  <Award className="w-8 h-8 text-brand-500 shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-white text-sm">{cert.courseSlug}</div>
                    <div className="text-2xs text-slate-400 mt-0.5">Diterbitkan {new Date(cert.issuedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                  <a href={`/certificates/${cert.verifyCode}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline shrink-0">Verifikasi →</a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
