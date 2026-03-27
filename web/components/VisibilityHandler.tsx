// components/VisibilityHandler.tsx
'use client';

import { useEffect } from 'react';

export function VisibilityHandler() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
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