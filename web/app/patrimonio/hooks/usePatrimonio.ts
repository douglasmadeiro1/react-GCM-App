'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/services/supabase';
import type { PatrimonioItem, TipoItem, StatusItem } from '../types';

export function usePatrimonio() {
  const queryClient = useQueryClient();

  // Buscar todos os itens
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['patrimonio'],
    queryFn: async () => {
      // Buscar todos os itens do patrimônio
      const { data, error } = await supabase
        .from('patrimonio')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Buscar os agentes relacionados separadamente
      const agentesIds = [...new Set(data.map(item => item.agente_id).filter(id => id))];
      
      let agentesMap: Record<number, any> = {};
      
      if (agentesIds.length > 0) {
        const { data: agentes } = await supabase
          .from('agentes')
          .select('id, "Nome", "Funcional", "Matricula"')
          .in('id', agentesIds);
        
        if (agentes) {
          agentesMap = Object.fromEntries(agentes.map(a => [a.id, a]));
        }
      }

      // Combinar os dados
      return data.map((item: any) => ({
        ...item,
        agente_nome: item.agente_id ? agentesMap[item.agente_id]?.Nome : null,
        agente_funcional: item.agente_id ? agentesMap[item.agente_id]?.Funcional : null,
      })) as PatrimonioItem[];
    },
  });

  // Buscar itens disponíveis para cautela
  const getItensDisponiveis = async (tipo?: TipoItem) => {
    let query = supabase
      .from('patrimonio')
      .select('*')
      .eq('status', 'disponivel');
    
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    
    const { data, error } = await query.order('marca');
    if (error) throw error;
    return data;
  };

  // Buscar um item específico
  const getItem = async (id: number): Promise<PatrimonioItem | null> => {
    const { data, error } = await supabase
      .from('patrimonio')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as PatrimonioItem;
  };

  // Salvar (criar ou atualizar) item
  const saveItem = useMutation({
    mutationFn: async (item: Partial<PatrimonioItem>) => {
      const { data: user } = await supabase.auth.getUser();
      const payload = {
        tipo: item.tipo,
        status: item.status || 'disponivel',
        marca: item.marca,
        modelo: item.modelo || null,
        numero_patrimonio: item.numero_patrimonio || null,
        numero_serie: item.numero_serie || null,
        calibre: item.calibre || null,
        craf: item.craf || null,
        capacidade_carregador: item.capacidade_carregador || 0,
        tamanho: item.tamanho || null,
        sexo: item.sexo || null,
        data_validade: item.data_validade || null,
        data_aquisicao: item.data_aquisicao || null,
        observacoes: item.observacoes || null,
        ...(item.id ? {} : { criado_por: user.user?.id }),
      };
      
      if (item.id) {
        const { data, error } = await supabase
          .from('patrimonio')
          .update(payload)
          .eq('id', item.id)
          .select()
          .single();
        if (error) throw error;
        return data as PatrimonioItem;
      } else {
        const { data, error } = await supabase
          .from('patrimonio')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        return data as PatrimonioItem;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patrimonio'] });
    },
  });

  // Excluir item
  const deleteItem = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('patrimonio')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patrimonio'] });
    },
  });

  // Cautelar item para um agente
  const cautelarItem = useMutation({
    mutationFn: async ({ itemId, agenteId, dataCautela, dataPrevista, observacoes }: {
      itemId: number;
      agenteId: number;
      dataCautela: string;
      dataPrevista?: string;
      observacoes?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('patrimonio')
        .update({
          status: 'cautelado',
          agente_id: agenteId,
          data_cautela: dataCautela,
          data_devolucao_prevista: dataPrevista || null,
          cautelado_por: user.user?.id,
          observacoes: observacoes ? `Cautela: ${observacoes}` : null,
        })
        .eq('id', itemId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patrimonio'] });
      window.dispatchEvent(new CustomEvent('patrimonio-updated', {
        detail: { acao: 'cautela' }
      }));
    },
  });

  // Devolver item
  const devolverItem = useMutation({
    mutationFn: async ({ itemId, agenteId, observacoes }: {
      itemId: number;
      agenteId: number;
      observacoes?: string;
    }) => {
      const { data, error } = await supabase
        .from('patrimonio')
        .update({
          status: 'disponivel',
          agente_id: null,
          data_cautela: null,
          data_devolucao_prevista: null,
          cautelado_por: null,
        })
        .eq('id', itemId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patrimonio'] });
      window.dispatchEvent(new CustomEvent('patrimonio-updated', {
        detail: { acao: 'devolucao' }
      }));
    },
  });

  return {
    items,
    isLoading,
    error,
    saveItem,
    deleteItem,
    cautelarItem,
    devolverItem,
    getItensDisponiveis,
    getItem,
  };
}