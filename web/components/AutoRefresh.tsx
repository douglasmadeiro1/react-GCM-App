// web/components/AutoRefresh.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

export function AutoRefresh() {
  const { user, checkSession } = useAuth();
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    // Verifica sessão a cada 2 minutos
    intervalRef.current = setInterval(async () => {
      const isValid = await checkSession();
      
      if (!isValid) {
        console.log('[AutoRefresh] Sessão inválida, limpando cache...');
        queryClient.clear();
      } else {
        // Renova queries ativas silenciosamente
        queryClient.invalidateQueries({
          predicate: (query) => {
            // Não recarrega queries de autenticação
            return !query.queryKey.includes('auth-user') &&
                   !query.queryKey.includes('session');
          }
        });
      }
    }, 2 * 60 * 1000); // 2 minutos

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, checkSession, queryClient]);

  return null;
}