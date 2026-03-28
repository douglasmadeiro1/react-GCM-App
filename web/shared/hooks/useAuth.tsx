// web/shared/hooks/useAuth.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { supabase } from '../services/supabase';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  nome: string;
  nivel: 'default' | 'administrador' | 'gestor';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const router = useRouter();
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(true);

  const carregarPerfil = useCallback(async (supabaseUser: User) => {
    if (!mountedRef.current) return null;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar perfil:', error);
        return null;
      }

      const nivel = profile?.nivel_usuario || 'default';
      const nome = profile?.nome || supabaseUser.email?.split('@')[0] || 'Usuário';

      const authUser: AuthUser = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        nome,
        nivel,
      };

      if (mountedRef.current) {
        setUser(authUser);
        // Armazena no cache do React Query
        queryClient.setQueryData(['auth-user'], authUser);
      }

      return authUser;
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      if (mountedRef.current) {
        setUser(null);
      }
      return null;
    }
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await carregarPerfil(session.user);
    }
  }, [carregarPerfil]);

  useEffect(() => {
    mountedRef.current = true;
    isLoadingRef.current = true;

    // sessão inicial
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await carregarPerfil(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Erro ao inicializar auth:', error);
        setUser(null);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          isLoadingRef.current = false;
        }
      }
    };

    initializeAuth();

    // listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('[Auth Evento]:', event);

        if (!mountedRef.current) return;

        // Evita processamento duplicado
        if (isLoadingRef.current && event === 'TOKEN_REFRESHED') {
          return;
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          // Limpa cache do React Query
          queryClient.clear();
          // Redireciona para login
          router.push('/login');
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            await carregarPerfil(session.user);
            // Invalida queries que dependem do usuário, mas não a de auth
            queryClient.invalidateQueries({
              predicate: (query) => {
                const key = query.queryKey[0];
                return key !== 'auth-user' && 
                       key !== 'session' &&
                       typeof key === 'string' &&
                       !key.includes('auth');
              }
            });
          }
        } else if (event === 'USER_UPDATED' && session?.user) {
          await carregarPerfil(session.user);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [carregarPerfil, queryClient, router]);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = async () => {
    console.log('[useAuth] Iniciando logout...');
    try {
      // Limpa cache antes de fazer logout
      queryClient.clear();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      console.log('[useAuth] Logout concluído com sucesso');
    } catch (error) {
      console.error('[useAuth] Erro no logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}