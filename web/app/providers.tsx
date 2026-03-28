// web/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/shared/hooks/useAuth';
import { SessionKeepAlive } from '@/components/SessionKeepAlive';
import { AutoRefresh } from '@/components/AutoRefresh';
import { useState, useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: true,
            refetchOnReconnect: true,
            retryOnMount: false,
          },
        },
      })
  );

  useEffect(() => {
    const handleBeforeUnload = () => {
      queryClient.invalidateQueries({ predicate: () => true });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SessionKeepAlive />
        <AutoRefresh />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}