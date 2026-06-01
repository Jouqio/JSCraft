// ── Shared domain types for JSCraft ──────────────────────────────────────────
// Imported by both @jscraft/web and @jscraft/api to ensure type safety
// across the full stack without duplication.

// ── Enums ────────────────────────────────────────────────────────────────────
export type Role = 'STUDENT' | 'ADMIN';
export type LessonType = 'THEORY' | 'PRACTICE' | 'PROJECT';
export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type QuestionType = 'MULTIPLE_CHOICE' | 'CODE_OUTPUT' | 'TRUE_FALSE';

// ── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: Role;
  xpTotal: number;
  level: number;
  streakCurrent: number;
  streakMax: number;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// ── Course & Lesson ──────────────────────────────────────────────────────────
export interface Course {
  id: string;
  slug: string;
  title: string;
  titleId: string;
  description: string;
  phase: number;
  week: number;
  order: number;
  isPublished: boolean;
  isPremium: boolean;
  lessonCount?: number;
  completedCount?: number;
}

export interface Lesson {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  titleId: string;
  type: LessonType;
  dayNumber: number;
  order: number;
  xpReward: number;
  content: LessonContent;
  starterCode: string | null;
  solutionCode?: string | null; // hidden from students
  isPublished: boolean;
}

export interface LessonContent {
  sections: ContentSection[];
}

export type ContentSection =
  | { type: 'prose'; text: string }
  | { type: 'code'; language: string; code: string; filename?: string }
  | { type: 'callout'; variant: 'info' | 'warning' | 'tip' | 'danger'; text: string }
  | { type: 'image'; src: string; alt: string; caption?: string };

// ── Progress ─────────────────────────────────────────────────────────────────
export interface Progress {
  lessonId: string;
  courseId: string;
  status: ProgressStatus;
  completedAt: string | null;
  xpEarned: number;
}

export interface ProgressMap {
  [lessonId: string]: Progress;
}

export interface StreakInfo {
  current: number;
  max: number;
  lastActiveAt: string | null;
  completedDates: string[];
}

// ── Quiz ─────────────────────────────────────────────────────────────────────
export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  timeLimit: number | null;
  passingScore: number;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: QuizOption[];
  explanation?: string;
  order: number;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean; // Only included for admins
}

export interface QuizSubmission {
  answers: { questionId: string; selectedOptionId: string }[];
  timeTaken?: number;
}

export interface QuizResult {
  score: number;
  passed: boolean;
  xpEarned: number;
  correctCount: number;
  totalCount: number;
  timeTaken: number | null;
}

// ── Exercise ─────────────────────────────────────────────────────────────────
export interface Exercise {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  starterCode: string;
  hints: string[];
  xpReward: number;
  testCases: TestCase[];
}

export interface TestCase {
  description: string;
  input?: string;
  expectedOutput: string;
}

export interface ExerciseResult {
  passed: boolean;
  results: TestCaseResult[];
  xpEarned: number;
}

export interface TestCaseResult {
  description: string;
  passed: boolean;
  expected: string;
  received: string;
}

// ── Achievements ─────────────────────────────────────────────────────────────
export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  iconUrl: string;
  xpReward: number;
  earnedAt?: string;
}

// ── Leaderboard ──────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  xpTotal: number;
  level: number;
  streakCurrent: number;
}

// ── API Responses ─────────────────────────────────────────────────────────────
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Pagination ────────────────────────────────────────────────────────────────
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ── Gamification ─────────────────────────────────────────────────────────────
export interface XPRewards {
  lesson_complete: number;
  quiz_pass: number;
  quiz_perfect: number;
  exercise_complete: number;
  streak_3_days: number;
  streak_7_days: number;
  streak_14_days: number;
  streak_30_days: number;
  first_lesson: number;
}

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  progressPercent: number;
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export interface AdminStats {
  totalUsers: number;
  activeToday: number;
  lessonsCompletedToday: number;
  totalLessonsCompleted: number;
  avgSessionMinutes: number;
}
