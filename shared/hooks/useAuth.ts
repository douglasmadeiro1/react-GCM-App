'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email!,
        nome,
        nivel,
        permissoes: PERMISSOES_POR_NIVEL[nivel],
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      if (mountedRef.current) {
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email!,
          nome: supabaseUser.email?.split('@')[0] || 'Usuário',
          nivel: 'default',
          permissoes: PERMISSOES_POR_NIVEL.default,
        });
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (data.session?.user && mountedRef.current) {
        await carregarPerfil(data.session.user);
      }
    } catch (error) {
      console.warn('Erro ao renovar sessão:', error);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    let subscription: any = null;

    async function loadUser() {
      if (loadingRef.current) return;
      loadingRef.current = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mountedRef.current) {
          await carregarPerfil(session.user);
        } else if (mountedRef.current) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
        if (mountedRef.current) setLoading(false);
      } finally {
        loadingRef.current = false;
      }
    }

    loadUser();

    // Configurar renovação automática a cada 10 minutos
    refreshIntervalRef.current = setInterval(() => {
      if (mountedRef.current && user) {
        refreshSession();
      }
    }, 10 * 60 * 1000); // 10 minutos

    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;
        
        console.log('[Auth] Evento:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setLoading(true);
          await carregarPerfil(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token renovado, recarregar perfil
          await carregarPerfil(session.user);
        } else if (event === 'USER_UPDATED' && session?.user) {
          await carregarPerfil(session.user);
        }
      }
    );

    subscription = authSubscription;

    // Timeout de segurança
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn('Timeout ao carregar usuário');
        setLoading(false);
      }
    }, 15000);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (subscription?.subscription) {
        subscription.subscription.unsubscribe();
      }
    };
  }, [refreshSession]);

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

  return { user, loading, login, logout, resetPassword };
}