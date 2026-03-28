// web/components/VisibilityHandler.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';

export function VisibilityHandler() {
  const queryClient = useQueryClient();
  const { checkSession, user } = useAuth();
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !isProcessingRef.current) {
        console.log('[VisibilityHandler] Aba visível, verificando sessão...');
        isProcessingRef.current = true;

        try {
          // Primeiro, verifica se a sessão ainda é válida
          const isValid = await checkSession();
          
          if (isValid) {
            console.log('[VisibilityHandler] Sessão válida, recarregando dados...');
            // Recarrega apenas queries que não são de autenticação
            queryClient.invalidateQueries({
              predicate: (query) => {
                const key = query.queryKey[0];
                return key !== 'auth-user' && 
                       key !== 'session' &&
                       typeof key === 'string' &&
                       !key.includes('profile') &&
                       !key.includes('user');
              }
            });
          } else {
            console.log('[VisibilityHandler] Sessão inválida, aguardando...');
            // Se sessão inválida, tenta novamente em 1 segundo
            setTimeout(async () => {
              const retryValid = await checkSession();
              if (retryValid) {
                queryClient.invalidateQueries();
              }
            }, 1000);
          }
        } catch (error) {
          console.error('[VisibilityHandler] Erro:', error);
        } finally {
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 500);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [queryClient, checkSession, user]);

  return null;
}