'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
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

let isInitializing = false;
// Cache para evitar recarregamentos desnecessários
let cachedUser: AuthUser | null = null;
let cachedLoading = true;

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(cachedUser);
  const [loading, setLoading] = useState(cachedLoading);
  const isMountedRef = useRef(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    let subscription: any = null;

    async function carregarPerfil(supabaseUser: User) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .maybeSingle();

        if (!isMountedRef.current) return;

        const nivel = profile?.nivel_usuario || 'default';
        const nome = profile?.nome || supabaseUser.email?.split('@')[0] || 'Usuário';

        const newUser = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          nome,
          nivel,
          permissoes: PERMISSOES_POR_NIVEL[nivel],
        };
        
        cachedUser = newUser;
        setUser(newUser);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        if (isMountedRef.current) {
          const fallbackUser = {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            nome: supabaseUser.email?.split('@')[0] || 'Usuário',
            nivel: 'default' as const,
            permissoes: PERMISSOES_POR_NIVEL.default,
          };
          cachedUser = fallbackUser;
          setUser(fallbackUser);
        }
      } finally {
        if (isMountedRef.current) {
          cachedLoading = false;
          setLoading(false);
        }
      }
    }

    async function initialize() {
      if (isInitializing || initializedRef.current) return;
      isInitializing = true;
      initializedRef.current = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && isMountedRef.current) {
          await carregarPerfil(session.user);
        } else if (isMountedRef.current) {
          cachedLoading = false;
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        if (isMountedRef.current) {
          cachedLoading = false;
          setLoading(false);
        }
      } finally {
        isInitializing = false;
      }
    }

    // Só inicializa se ainda não foi inicializado
    if (!initializedRef.current) {
      initialize();
    } else {
      // Se já foi inicializado, usa o cache
      setUser(cachedUser);
      setLoading(cachedLoading);
    }

    // Escutar mudanças na autenticação
    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMountedRef.current) return;
        
        // Só atualiza para eventos de login/logout
        if (event === 'SIGNED_IN' && session?.user) {
          setLoading(true);
          await carregarPerfil(session.user);
        } else if (event === 'SIGNED_OUT') {
          cachedUser = null;
          cachedLoading = false;
          setUser(null);
          setLoading(false);
        }
        // Ignora TOKEN_REFRESHED e outros eventos
      }
    );

    subscription = authSubscription;

    return () => {
      isMountedRef.current = false;
      if (subscription?.subscription) {
        subscription.subscription.unsubscribe();
      }
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

  return { user, loading, login, logout, resetPassword, isGestor, isAdmin };
}