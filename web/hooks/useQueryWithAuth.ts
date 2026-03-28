// web/hooks/useQueryWithAuth.ts
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { useEffect, useState } from 'react';

export function useQueryWithAuth<TData = unknown, TError = unknown>(
  key: string[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> & { isAuthChecking: boolean } {
  const { user, loading: authLoading, checkSession } = useAuth();
  const [isAuthChecking, setIsAuthChecking] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  useEffect(() => {
    const verifyAuth = async () => {
      if (authLoading) return;
      
      if (!user) {
        setIsAuthChecking(true);
        const isValid = await checkSession();
        setIsAuthenticated(isValid);
        setIsAuthChecking(false);
      } else {
        setIsAuthenticated(true);
      }
    };

    verifyAuth();
  }, [user, authLoading, checkSession]);

  const query = useQuery({
    queryKey: [...key, user?.id],
    queryFn: async () => {
      // Verifica autenticação antes de executar a query
      if (!isAuthenticated && !user) {
        const isValid = await checkSession();
        if (!isValid) {
          throw new Error('Usuário não autenticado');
        }
      }
      return queryFn();
    },
    enabled: !authLoading && (isAuthenticated || !!user),
    retry: 1,
    ...options,
  });

  return {
    ...query,
    isAuthChecking: authLoading || isAuthChecking,
  };
}