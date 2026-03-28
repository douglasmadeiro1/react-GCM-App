// web/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/shared/hooks/useAuth';
import { SessionKeepAlive } from '@/components/SessionKeepAlive';
import { useState, useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 10 * 60 * 1000, // 10 minutos
            retry: 1,
            refetchOnWindowFocus: false, // DESATIVADO - essencial para evitar o bug
            refetchOnMount: true,
            refetchOnReconnect: true,
            retryOnMount: false,
          },
        },
      })
  );

  // Limpa queries quando o usuário fecha a aba
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Marca queries como inválidas mas não limpa tudo
      queryClient.invalidateQueries({ predicate: () => true });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SessionKeepAlive />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}