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

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        carregarPerfil(session.user);
      } else {
        setLoading(false);
      }
    });

    // Escutar mudanças na autenticação
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await carregarPerfil(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  async function carregarPerfil(supabaseUser: User) {
  try {
    // Buscar perfil do usuário na tabela profiles
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    console.log('=== CARREGANDO PERFIL ===');
    console.log('User ID:', supabaseUser.id);
    console.log('Profile encontrado:', profile);
    console.log('Erro:', error);
    console.log('========================');

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
    // Fallback para usuário sem perfil
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