import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { ProgressMap, ProgressStatus, StreakInfo } from '@jscraft/types';
import { api } from '@lib/api';
import { useAuthStore } from './authStore';

interface ProgressState {
  // Map of lessonId → ProgressStatus (fast lookup)
  progress: ProgressMap;
  // Streak data
  streak: StreakInfo;
  // Sync state
  lastSyncedAt: string | null;
  isSyncing: boolean;

  // Actions
  startLesson: (lessonId: string, courseId: string) => Promise<void>;
  completeLesson: (lessonId: string, courseId: string) => Promise<{ xpEarned: number }>;
  getLessonStatus: (lessonId: string) => ProgressStatus;
  getCompletedCount: () => number;
  syncFromServer: () => Promise<void>;
  hydrateStreak: () => Promise<void>;
  reset: () => void;
}

const defaultStreak: StreakInfo = {
  current: 0,
  max: 0,
  lastActiveAt: null,
  completedDates: [],
};

export const useProgressStore = create<ProgressState>()(
  devtools(
    persist(
      (set, get) => ({
        progress: {},
        streak: defaultStreak,
        lastSyncedAt: null,
        isSyncing: false,

        getLessonStatus: (lessonId) => {
          const entry = get().progress[lessonId];
          return entry?.status ?? 'NOT_STARTED';
        },

        getCompletedCount: () =>
          Object.values(get().progress).filter((p) => p.status === 'COMPLETED').length,

        startLesson: async (lessonId, courseId) => {
          // Optimistic update
          set((state) => ({
            progress: {
              ...state.progress,
              [lessonId]: {
                lessonId,
                courseId,
                status: 'IN_PROGRESS',
                completedAt: null,
                xpEarned: 0,
              },
            },
          }));

          const { isAuthenticated } = useAuthStore.getState();
          if (isAuthenticated) {
            await api.post(`/progress/${lessonId}/start`).catch(() => {
              // Non-fatal — progress is still tracked locally
            });
          }
        },

        completeLesson: async (lessonId, courseId) => {
          const { isAuthenticated, addXP } = useAuthStore.getState();

          let xpEarned = 10; // default local XP

          if (isAuthenticated) {
            try {
              const { data } = await api.post<{ xpEarned: number; streak: StreakInfo }>(
                `/progress/${lessonId}/complete`
              );
              xpEarned = data.xpEarned;
              set({ streak: data.streak });
            } catch {
              // Fall through — still mark locally
            }
          }

          const now = new Date().toISOString();
          set((state) => ({
            progress: {
              ...state.progress,
              [lessonId]: {
                lessonId,
                courseId,
                status: 'COMPLETED',
                completedAt: now,
                xpEarned,
              },
            },
          }));

          addXP(xpEarned);
          return { xpEarned };
        },

        syncFromServer: async () => {
          const { isAuthenticated } = useAuthStore.getState();
          if (!isAuthenticated || get().isSyncing) return;

          set({ isSyncing: true });
          try {
            const { data } = await api.get<{ progress: ProgressMap; streak: StreakInfo }>(
              '/progress'
            );
            set({
              progress: data.progress,
              streak: data.streak,
              lastSyncedAt: new Date().toISOString(),
            });
          } finally {
            set({ isSyncing: false });
          }
        },

        hydrateStreak: async () => {
          const { isAuthenticated } = useAuthStore.getState();
          if (!isAuthenticated) return;
          try {
            const { data } = await api.get<StreakInfo>('/progress/streak');
            set({ streak: data });
          } catch {
            // Non-fatal
          }
        },

        reset: () => set({ progress: {}, streak: defaultStreak, lastSyncedAt: null }),
      }),
      {
        name: 'jscraft-progress',
        partialize: (state) => ({
          progress: state.progress,
          streak: state.streak,
          lastSyncedAt: state.lastSyncedAt,
        }),
      }
    ),
    { name: 'ProgressStore' }
  )
);
