import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './index.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on tab switch unless stale
    },
  },
});

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  );
}
