// web/components/VisibilityHandler.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function VisibilityHandler() {
  const queryClient = useQueryClient();
  const isInvalidatingRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[VisibilityHandler] Aba visível, recarregando dados...');
        
        // Evita múltiplas invalidações simultâneas
        if (isInvalidatingRef.current) return;
        
        isInvalidatingRef.current = true;
        
        // Pequeno delay para evitar conflitos
        setTimeout(() => {
          // Recarrega apenas queries ativas, excluindo autenticação
          queryClient.invalidateQueries({
            predicate: (query) => {
              const queryKey = query.queryKey;
              // Exclui queries de autenticação e perfil
              return !queryKey.includes('session') && 
                     !queryKey.includes('auth-user') &&
                     queryKey[0] !== 'user' &&
                     !String(queryKey[0]).includes('profile');
            }
          }).finally(() => {
            isInvalidatingRef.current = false;
          });
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queryClient]);

  return null;
}