// shared/hooks/useAuth.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { supabase } from '../../shared/services/supabase';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

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
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarPerfil = useCallback(async (supabaseUser: User) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      const nivel = profile?.nivel_usuario || 'default';
      const nome = profile?.nome || supabaseUser.email?.split('@')[0] || 'Usuário';

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email!,
        nome,
        nivel,
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // sessão inicial
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        carregarPerfil(data.session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // listener
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('[Auth Evento]:', event);

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            await carregarPerfil(session.user);
          }
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [carregarPerfil]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return !error;
  };

  const logout = async () => {
    console.log('[useAuth] Iniciando logout...');
    try {
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
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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