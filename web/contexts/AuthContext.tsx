// contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
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

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Cache global
let globalUser: AuthUser | null = null;
let globalLoading = false;
let initialized = false;
let lastEventTime = 0;
let lastEventType = '';
const EVENT_COOLDOWN = 2000; // 2 segundos de cooldown para eventos

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(globalUser);
  const [loading, setLoading] = useState(globalLoading);
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);

  async function carregarPerfil(supabaseUser: User) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (!mountedRef.current) return;

      const nivel = profile?.nivel_usuario || 'default';
      const nome = profile?.nome || supabaseUser.email?.split('@')[0] || 'Usuário';

      const newUser: AuthUser = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        nome,
        nivel,
        permissoes: PERMISSOES_POR_NIVEL[nivel],
      };
      
      globalUser = newUser;
      setUser(newUser);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      if (mountedRef.current && !globalUser) {
        const fallbackUser: AuthUser = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          nome: supabaseUser.email?.split('@')[0] || 'Usuário',
          nivel: 'default',
          permissoes: PERMISSOES_POR_NIVEL.default,
        };
        globalUser = fallbackUser;
        setUser(fallbackUser);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        globalLoading = false;
      }
    }
  }

  async function initialize() {
    if (initializingRef.current || initialized) return;
    initializingRef.current = true;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && mountedRef.current) {
        await carregarPerfil(session.user);
      } else if (mountedRef.current) {
        setLoading(false);
        globalLoading = false;
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      if (mountedRef.current) {
        setLoading(false);
        globalLoading = false;
      }
    } finally {
      initializingRef.current = false;
      initialized = true;
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    
    if (!initialized) {
      initialize();
    } else {
      setUser(globalUser);
      setLoading(globalLoading);
    }

    const { data: authData } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;
        
        const now = Date.now();
        const isDuplicateEvent = (
          event === lastEventType && 
          (now - lastEventTime) < EVENT_COOLDOWN
        );
        
        console.log('[Auth] Evento:', event, isDuplicateEvent ? '(IGNORADO - duplicado)' : '');
        
        // IGNORA EVENTOS DUPLICADOS
        if (isDuplicateEvent) {
          return;
        }
        
        lastEventTime = now;
        lastEventType = event;
        
        // Só processa SIGNED_IN se NÃO tiver usuário já logado
        if (event === 'SIGNED_IN' && session?.user) {
          // Se já temos um usuário, ignora o evento duplicado
          if (globalUser && globalUser.id === session.user.id) {
            console.log('[Auth] Usuário já logado, ignorando SIGNED_IN');
            return;
          }
          
          setLoading(true);
          await carregarPerfil(session.user);
        } else if (event === 'SIGNED_OUT') {
          globalUser = null;
          globalLoading = false;
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      authData?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    resetPassword,
    isGestor,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
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