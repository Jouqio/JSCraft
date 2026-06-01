import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { PageSpinner } from '@components/ui/Spinner';

export default function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
