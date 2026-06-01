import { useCallback } from 'react';
import { useProgressStore } from '@store/progressStore';
import type { ProgressStatus } from '@jscraft/types';

/** Convenience hook for progress queries */
export function useProgress() {
  const store = useProgressStore();

  const getStatus = useCallback(
    (lessonId: string): ProgressStatus => store.getLessonStatus(lessonId),
    [store]
  );

  const isCompleted = useCallback(
    (lessonId: string) => getStatus(lessonId) === 'COMPLETED',
    [getStatus]
  );

  const courseProgress = useCallback(
    (lessonIds: string[]) => {
      const completed = lessonIds.filter((id) => isCompleted(id)).length;
      return {
        completed,
        total: lessonIds.length,
        percent: lessonIds.length > 0 ? Math.round((completed / lessonIds.length) * 100) : 0,
      };
    },
    [isCompleted]
  );

  return {
    progress:      store.progress,
    streak:        store.streak,
    isSyncing:     store.isSyncing,
    getStatus,
    isCompleted,
    courseProgress,
    completeLesson: store.completeLesson,
    startLesson:    store.startLesson,
    completedCount: store.getCompletedCount(),
  };
}
