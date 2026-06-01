import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@components/layout/RootLayout';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

const LandingPage        = lazy(() => import('@pages/LandingPage'));
const LoginPage          = lazy(() => import('@pages/auth/LoginPage'));
const RegisterPage       = lazy(() => import('@pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@pages/auth/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('@pages/auth/ResetPasswordPage'));
const DashboardPage      = lazy(() => import('@pages/DashboardPage'));
const ProfilePage        = lazy(() => import('@pages/ProfilePage'));
const CoursesPage        = lazy(() => import('@pages/CoursesPage'));
const CoursePage         = lazy(() => import('@pages/CoursePage'));
const LessonPage         = lazy(() => import('@pages/LessonPage'));
const PlaygroundPage     = lazy(() => import('@pages/PlaygroundPage'));
const QuizPage           = lazy(() => import('@pages/QuizPage'));
const LeaderboardPage    = lazy(() => import('@pages/LeaderboardPage'));
const CertificatePage    = lazy(() => import('@pages/CertificatePage'));
const AdminPage          = lazy(() => import('@pages/admin/AdminPage'));
const AdminLessonEditor  = lazy(() => import('@pages/admin/LessonEditorPage'));
const AdminUserManager   = lazy(() => import('@pages/admin/UserManagerPage'));
const AdminAnalytics     = lazy(() => import('@pages/admin/AnalyticsPage'));
const NotFoundPage       = lazy(() => import('@pages/NotFoundPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // ── Public ────────────────────────────────────────────
      { index: true,               element: <LandingPage /> },
      { path: 'login',             element: <LoginPage /> },
      { path: 'register',          element: <RegisterPage /> },
      { path: 'forgot-password',   element: <ForgotPasswordPage /> },
      { path: 'reset-password',    element: <ResetPasswordPage /> },

      // ── Courses (browse=public, lessons=protected) ─────────
      { path: 'courses',           element: <CoursesPage /> },
      { path: 'courses/:slug',     element: <CoursePage /> },
      {
        path: 'courses/:slug/:lessonId',
        element: <ProtectedRoute><LessonPage /></ProtectedRoute>,
      },

      // ── Protected user routes ──────────────────────────────
      { path: 'dashboard', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
      { path: 'profile',   element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
      { path: 'profile/:username', element: <ProfilePage /> },
      { path: 'quiz/:id',  element: <ProtectedRoute><QuizPage /></ProtectedRoute> },

      // ── Public utilities ───────────────────────────────────
      { path: 'playground',           element: <PlaygroundPage /> },
      { path: 'leaderboard',          element: <LeaderboardPage /> },
      { path: 'certificates/:code',   element: <CertificatePage /> },

      // ── Admin (ADMIN role required) ────────────────────────
      { path: 'admin',              element: <AdminRoute><AdminPage /></AdminRoute> },
      { path: 'admin/lessons/:id',  element: <AdminRoute><AdminLessonEditor /></AdminRoute> },
      { path: 'admin/users',        element: <AdminRoute><AdminUserManager /></AdminRoute> },
      { path: 'admin/analytics',    element: <AdminRoute><AdminAnalytics /></AdminRoute> },

      // ── 404 ────────────────────────────────────────────────
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
