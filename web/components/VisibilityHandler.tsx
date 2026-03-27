// components/VisibilityHandler.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '../shared/hooks/useAuth';
import { supabase } from '../shared/services/supabase'; // ← ADICIONE ESTA LINHA

export function VisibilityHandler() {
  const { user } = useAuth();
  const isRefreshing = useRef(false);

  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = async () => {
      // Quando voltar para a aba e NÃO estiver em loading
      if (!document.hidden && !isRefreshing.current) {
        isRefreshing.current = true;
        
        try {
          // Apenas verifica se a sessão ainda é válida, não recarrega a página
          const { data } = await supabase.auth.getSession();
          
          if (!data.session) {
            // Se perdeu a sessão, redireciona suavemente
            window.location.href = '/login';
          }
        } catch (error) {
          console.warn('Erro ao verificar sessão ao voltar:', error);
        } finally {
          isRefreshing.current = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  return null;
}