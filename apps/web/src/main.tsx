import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import { registerAuthStore } from './lib/api.ts';
import { useAuthStore } from './store/authStore.ts';
import './styles/globals.css';

// ── Register auth store with API client (breaks circular dep) ──
registerAuthStore(
  () => useAuthStore.getState().accessToken,
  () => useAuthStore.getState().refreshToken(),
  () => useAuthStore.getState().accessToken
);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('#root not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          },
          success: { iconTheme: { primary: '#f59e0b', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </HelmetProvider>
  </React.StrictMode>
);
