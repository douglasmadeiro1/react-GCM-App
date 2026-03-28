'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '../shared/services/supabase';

export function SessionKeepAlive() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Renovar sessão a cada 5 minutos
    intervalRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn('Erro ao renovar sessão:', error.message);
        } else if (data.session) {
          console.log('[KeepAlive] Sessão renovada com sucesso');
        }
      } catch (error) {
        console.warn('Erro ao renovar sessão:', error);
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return null;
}