'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/services/supabase';
import type { Infringement, InfringementFormData, StatusAutuacao } from '../types';

export function useInfringements() {
  const queryClient = useQueryClient();

  // Buscar todas as autuações
  const { data: infringements, isLoading, error } = useQuery({
    queryKey: ['infringements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autuacoes')
        .select('*')
        .order('data_autuacao', { ascending: false });

      if (error) throw error;
      return data as Infringement[];
    },
  });

  // Buscar autuação específica
  const getInfringement = async (id: number): Promise<Infringement | null> => {
    const { data, error } = await supabase
      .from('autuacoes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Infringement;
  };

  // Salvar autuação
  const saveInfringement = useMutation({
    mutationFn: async (data: InfringementFormData) => {
      const { data: result, error } = await supabase
        .from('autuacoes')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result as Infringement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infringements'] });
    },
  });

  // Atualizar autuação
  const updateInfringement = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InfringementFormData> }) => {
      const { data: result, error } = await supabase
        .from('autuacoes')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Infringement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infringements'] });
    },
  });

  // Atualizar status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: StatusAutuacao }) => {
      const { data: result, error } = await supabase
        .from('autuacoes')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Infringement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infringements'] });
    },
  });

  // Excluir autuação
  const deleteInfringement = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('autuacoes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infringements'] });
    },
  });

  // Calcular status baseado no prazo
  const calcularStatus = (dataAutuacao: string, prazoDias: number | null): StatusAutuacao => {
    if (!prazoDias) return 'pendente';
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataAut = new Date(dataAutuacao);
    dataAut.setHours(0, 0, 0, 0);
    
    const dataLimite = new Date(dataAut);
    dataLimite.setDate(dataLimite.getDate() + prazoDias);
    
    if (hoje > dataLimite) return 'vencido';
    return 'pendente';
  };

  // Atualizar todos os status automaticamente
  const atualizarStatusAutomatico = async () => {
    const { data } = await supabase
      .from('autuacoes')
      .select('id, data_autuacao, prazo_dias, status')
      .in('status', ['pendente', 'vencido']);

    if (!data) return;

    for (const item of data) {
      const novoStatus = calcularStatus(item.data_autuacao, item.prazo_dias);
      if (novoStatus !== item.status) {
        await updateStatus.mutateAsync({ id: item.id, status: novoStatus });
      }
    }
  };

  // Buscar agentes para o select
  const getAgentes = async () => {
    const { data, error } = await supabase
      .from('agentes')
      .select('id, Nome, Funcional')
      .order('Funcional', { ascending: true });

    if (error) throw error;
    return data;
  };

  return {
    infringements,
    isLoading,
    error,
    saveInfringement,
    updateInfringement,
    updateStatus,
    deleteInfringement,
    getInfringement,
    calcularStatus,
    atualizarStatusAutomatico,
    getAgentes,
  };
}