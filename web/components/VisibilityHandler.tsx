// components/VisibilityHandler.tsx
'use client';

import { useEffect, useRef } from 'react';

export function VisibilityHandler() {
  const lastRunRef = useRef<number>(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const now = Date.now();
      // Limita a uma execução por segundo
      if (!document.hidden && now - lastRunRef.current > 1000) {
        lastRunRef.current = now;
        console.log('[VisibilityHandler] Aba visível');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}