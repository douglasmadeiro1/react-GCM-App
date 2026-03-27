'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { supabase } from '../shared/services/supabase';
import {
  User,
  AuthChangeEvent,
  Session,
} from '@supabase/supabase-js';

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
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isGestor: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  const initializingRef = useRef(true);

  // 🔥 Evita múltiplas execuções simultâneas
  const loadingProfileRef = useRef(false);

  async function carregarPerfil(supabaseUser: User) {
    if (loadingProfileRef.current) return;
    loadingProfileRef.current = true;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (error) {
        console.error('Erro ao buscar profile:', error);
      }

      const nivel = profile?.nivel_usuario || 'default';
      const nome =
        profile?.nome ||
        supabaseUser.email?.split('@')[0] ||
        'Usuário';

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email!,
        nome,
        nivel,
        permissoes: PERMISSOES_POR_NIVEL[nivel],
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      loadingProfileRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
        initializingRef.current = false;
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (session?.user) {
          await carregarPerfil(session.user);
        } else {
          setUser(null);
          setLoading(false);
          initializingRef.current = false;
        }
      } catch (error) {
        console.error('Erro ao iniciar sessão:', error);
        setLoading(false);
        initializingRef.current = false;
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mountedRef.current) return;

        // 🔥 Ignora eventos durante inicialização
        if (initializingRef.current) return;

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
      mountedRef.current = false;
      listener.subscription.unsubscribe();
    };
  }, []);

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
    await supabase.auth.signOut();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        resetPassword,
        isGestor: () => user?.nivel === 'gestor',
        isAdmin: () => user?.nivel === 'administrador',
      }}
    >
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