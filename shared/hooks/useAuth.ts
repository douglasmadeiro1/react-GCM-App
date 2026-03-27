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

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    
    let subscription: any = null;

    async function loadUser() {
      // Evitar múltiplas chamadas simultâneas
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

    loadUser();

    // Escutar mudanças na autenticação
    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mountedRef.current) return;
        
        if (session?.user) {
          setLoading(true);
          await carregarPerfil(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    subscription = authSubscription;

    // Configurar timeout para evitar loading infinito (10 segundos)
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn('Timeout ao carregar usuário');
        setLoading(false);
      }
    }, 10000);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      if (subscription?.subscription) {
        subscription.subscription.unsubscribe();
      }
    };
  }, []); // Array de dependências vazio

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