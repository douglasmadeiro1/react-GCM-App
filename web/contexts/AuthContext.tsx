'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../shared/services/supabase';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  nome: string;
  nivel: 'default' | 'administrador' | 'gestor';
  permissoes: Permissoes;
}

interface Permissoes {
  podeVisualizar: boolean;
  podeEditarAgentes: boolean;
  podeExcluirAgentes: boolean;
  podeAdicionarMateriais: boolean;
  podeEditarMateriais: boolean;
  podeExcluirMateriais: boolean;
  podeGerenciarUsuarios: boolean;
  podeExportar: boolean;
}

const PERMISSOES_POR_NIVEL: Record<string, Permissoes> = {
  default: {
    podeVisualizar: true,
    podeEditarAgentes: false,
    podeExcluirAgentes: false,
    podeAdicionarMateriais: false,
    podeEditarMateriais: false,
    podeExcluirMateriais: false,
    podeGerenciarUsuarios: false,
    podeExportar: false,
  },
  administrador: {
    podeVisualizar: true,
    podeEditarAgentes: true,
    podeExcluirAgentes: true,
    podeAdicionarMateriais: true,
    podeEditarMateriais: true,
    podeExcluirMateriais: true,
    podeGerenciarUsuarios: false,
    podeExportar: true,
  },
  gestor: {
    podeVisualizar: true,
    podeEditarAgentes: true,
    podeExcluirAgentes: true,
    podeAdicionarMateriais: true,
    podeEditarMateriais: true,
    podeExcluirMateriais: true,
    podeGerenciarUsuarios: true,
    podeExportar: true,
  },
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isGestor: () => boolean;
  isAdmin: () => boolean;
}

// ✅ Melhor padrão
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function carregarPerfil(supabaseUser: User) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      const nivel = profile?.nivel_usuario || 'default';
      const nome =
        profile?.nome ||
        supabaseUser.email?.split('@')[0] ||
        'Usuário';

      const newUser: AuthUser = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        nome,
        nivel,
        permissoes: PERMISSOES_POR_NIVEL[nivel],
      };

      setUser(newUser);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);

      // fallback seguro
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email!,
        nome: supabaseUser.email?.split('@')[0] || 'Usuário',
        nivel: 'default',
        permissoes: PERMISSOES_POR_NIVEL.default,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Evento:', event);

        // ✅ sessão inicial (quando abre o app)
        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            await carregarPerfil(session.user);
          } else {
            setLoading(false);
          }
        }

        // ✅ login REAL (evita loop)
        if (event === 'SIGNED_IN') {
          if (!user && session?.user) {
            setLoading(true);
            await carregarPerfil(session.user);
          }
        }

        // ✅ logout
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      data.subscription.unsubscribe();
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const isGestor = () => user?.nivel === 'gestor';
  const isAdmin = () => user?.nivel === 'administrador';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        resetPassword,
        isGestor,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}