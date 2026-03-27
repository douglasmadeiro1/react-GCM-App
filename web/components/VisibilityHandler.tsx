// components/VisibilityHandler.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function VisibilityHandler() {
  const { loading, user } = useAuth();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[VisibilityHandler] Aba visível - Estado atual:', {
          loading,
          user: user?.nome,
          timestamp: new Date().toISOString()
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading, user]);

  return null;
}