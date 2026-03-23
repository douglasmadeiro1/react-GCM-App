'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/services/supabase';
import type { User, UserFormData, NivelUsuario } from '../types';

export function useUsers() {
  const queryClient = useQueryClient();

  // Buscar todos os usuários (apenas gestores têm acesso)
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as User[];
    },
  });

  // Buscar usuário específico
  const getUser = async (id: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as User;
  };

  // Salvar/Atualizar usuário
  const saveUser = useMutation({
    mutationFn: async (userData: UserFormData) => {
      // Verificar se o perfil já existe
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userData.id)
        .single();

      if (existing) {
        // Atualizar
        const { data, error } = await supabase
          .from('profiles')
          .update({
            nome: userData.nome,
            email: userData.email,
            nivel_usuario: userData.nivel_usuario,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userData.id)
          .select()
          .single();

        if (error) throw error;
        return data as User;
      } else {
        // Criar novo perfil
        const { data, error } = await supabase
          .from('profiles')
          .insert([{
            id: userData.id,
            nome: userData.nome,
            email: userData.email,
            nivel_usuario: userData.nivel_usuario,
          }])
          .select()
          .single();

        if (error) throw error;
        return data as User;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Excluir usuário (remover perfil - o usuário do Auth permanece)
  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Atualizar nível do usuário
  const updateUserLevel = useMutation({
    mutationFn: async ({ id, nivel_usuario }: { id: string; nivel_usuario: NivelUsuario }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ nivel_usuario, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Atualizar o próprio perfil do usuário logado
  const updateProfile = useMutation({
    mutationFn: async ({ nome }: { nome: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('profiles')
        .update({ nome, updated_at: new Date().toISOString() })
        .eq('id', user.user.id)
        .select()
        .single();

      if (error) throw error;
      return data as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    users,
    isLoading,
    error,
    saveUser,
    deleteUser,
    updateUserLevel,
    updateProfile,
    getUser,
  };
}