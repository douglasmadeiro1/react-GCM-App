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
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const router = useRouter();
  const isLoadingRef = useRef(false);
  const mountedRef = useRef(true);
  const initialCheckDone = useRef(false);

  const carregarPerfil = useCallback(async (supabaseUser: User): Promise<AuthUser | null> => {
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
        queryClient.setQueryData(['user', supabaseUser.id], profile);
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

  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[checkSession] Erro:', error);
        return false;
      }

      if (session?.user) {
        const authUser = await carregarPerfil(session.user);
        return !!authUser;
      }
      
      return false;
    } catch (error) {
      console.error('[checkSession] Erro inesperado:', error);
      return false;
    }
  }, [carregarPerfil]);

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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          setUser(null);
        } else if (session?.user) {
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
          initialCheckDone.current = true;
        }
      }
    };

    initializeAuth();

    // listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('[Auth Evento]:', event);

        if (!mountedRef.current) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          // Limpa todo o cache
          queryClient.clear();
          // Redireciona para login
          router.push('/login');
          return;
        }

        if (event === 'SIGNED_IN') {
          if (session?.user) {
            await carregarPerfil(session.user);
            // Recria o queryClient após login
            queryClient.invalidateQueries();
          }
        }
        
        if (event === 'TOKEN_REFRESHED') {
          // Só atualiza o perfil se já tiver usuário logado
          if (session?.user && user) {
            await carregarPerfil(session.user);
          }
        }
        
        if (event === 'USER_UPDATED' && session?.user) {
          await carregarPerfil(session.user);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [carregarPerfil, queryClient, router, user]);

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
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      refreshUser,
      checkSession 
    }}>
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