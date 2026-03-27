// components/VisibilityHandler.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '../shared/hooks/useAuth';
import { supabase } from '../shared/services/supabase';

export function VisibilityHandler() {
  const { user, loading } = useAuth();
  const isRefreshing = useRef(false);
  const hasReloaded = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Quando voltar para a aba
      if (!document.hidden && !isRefreshing.current) {
        isRefreshing.current = true;
        
        try {
          // Verifica se a sessão ainda é válida
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            // Se perdeu a sessão, redireciona para login
            window.location.href = '/login';
          } else if (loading && !hasReloaded.current) {
            // Se ainda está em loading e já tem sessão, força um recarregamento suave
            hasReloaded.current = true;
            console.log('[VisibilityHandler] Forçando recarregamento da página');
            window.location.reload();
          }
        } catch (error) {
          console.warn('Erro ao verificar sessão ao voltar:', error);
        } finally {
          setTimeout(() => {
            isRefreshing.current = false;
          }, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading]);

  return null;
}