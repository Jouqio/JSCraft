import { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { PageSpinner } from '@components/ui/Spinner';
import { useAuthStore } from '@store/authStore';

export default function App() {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    // Single-flight session recovery at app boot via httpOnly cookie
    useAuthStore
      .getState()
      .refreshToken()
      .finally(() => {
        useAuthStore.getState().hydrateComplete();
      });
  }, []);

  // Protected routes will never render before session restoration completes
  if (status === 'restoring') {
    return <PageSpinner />;
  }

  return (
    <Suspense fallback={<PageSpinner />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
