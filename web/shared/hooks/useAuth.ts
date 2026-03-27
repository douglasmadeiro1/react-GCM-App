'use client';

import { useEffect, useState } from 'react';
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

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let subscription: any = null;

    async function carregarPerfil(supabaseUser: User, isMounted: boolean) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .maybeSingle();

        if (!isMounted) return;

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
        if (isMounted) {
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email!,
            nome: supabaseUser.email?.split('@')[0] || 'Usuário',
            nivel: 'default',
            permissoes: PERMISSOES_POR_NIVEL.default,
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    async function initialize() {
      if (isInitializing) return;
      isInitializing = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && isMounted) {
          await carregarPerfil(session.user, isMounted);
        } else if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        if (isMounted) setLoading(false);
      } finally {
        isInitializing = false;
      }
    }

    initialize();

    // Escutar mudanças na autenticação
    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        // CORREÇÃO: Só atualiza se o evento for SIGNED_IN ou SIGNED_OUT
        // Ignora eventos como TOKEN_REFRESHED que não devem resetar o loading
        if (event === 'SIGNED_IN') {
          if (session?.user) {
            setLoading(true);
            await carregarPerfil(session.user, isMounted);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
        // Para outros eventos (como TOKEN_REFRESHED), não faz nada
      }
    );

    subscription = authSubscription;

    return () => {
      isMounted = false;
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