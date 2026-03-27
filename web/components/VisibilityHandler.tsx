// components/VisibilityHandler.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '../shared/hooks/useAuth';

export function VisibilityHandler() {
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Quando voltar para a aba e NÃO estiver em loading
      if (!document.hidden) {
        console.log('[VisibilityHandler] Voltei para a aba, loading:', loading, 'user:', user?.nome);
        
        // Se estava em loading mas o usuário já existe, algo deu errado
        if (loading && user) {
          console.log('[VisibilityHandler] Detectado estado inconsistente, recarregando...');
          window.location.reload();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading, user]);

  return null;
}