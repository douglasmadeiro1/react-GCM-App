// web/components/SessionKeepAlive.tsx
'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/shared/services/supabase';
import { useAuth } from '@/shared/hooks/useAuth';

export function SessionKeepAlive() {
  const { user, refreshUser } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    // Limpa intervalo existente
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Renova sessão a cada 10 minutos (mais seguro que 5)
    intervalRef.current = setInterval(async () => {
      if (isRefreshingRef.current) return;
      
      try {
        isRefreshingRef.current = true;
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          // Se erro de sessão expirada, faz logout silencioso
          if (error.message.includes('refresh token not found')) {
            console.log('[KeepAlive] Sessão expirada, será renovada no próximo acesso');
          } else {
            console.warn('[KeepAlive] Erro ao renovar sessão:', error.message);
          }
        } else if (data.session) {
          console.log('[KeepAlive] Sessão renovada com sucesso');
          // Recarrega dados do usuário
          await refreshUser();
        }
      } catch (error) {
        console.warn('[KeepAlive] Erro ao renovar sessão:', error);
      } finally {
        isRefreshingRef.current = false;
      }
    }, 10 * 60 * 1000); // 10 minutos

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, refreshUser]);

  return null;
}