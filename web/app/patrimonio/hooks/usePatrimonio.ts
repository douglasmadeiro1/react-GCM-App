'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/services/supabase';
import type { PatrimonioItem, TipoItem, StatusItem } from '../types';

export function usePatrimonio() {
  const queryClient = useQueryClient();


  // Função auxiliar para parsear campos JSON
function parseJsonField(field: any, defaultValue: any = []): any {
  if (!field) return defaultValue;
  try {
    return typeof field === 'string' ? JSON.parse(field) : field;
  } catch {
    return defaultValue;
  }
}
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
    
    // 1. Buscar o item para saber o tipo
    const { data: item } = await supabase
      .from('patrimonio')
      .select('*')
      .eq('id', itemId)
      .single();
    
    // 2. Atualizar patrimônio
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
    
    // 3. Buscar o agente para adicionar o item
    const { data: agente } = await supabase
      .from('agentes')
      .select('*')
      .eq('id', agenteId)
      .single();
    
    // 4. Adicionar ao array do agente
    const campoArray = item.tipo === 'arma' ? 'Armas' : 'Coletes';
    const arrayAtual = parseJsonField(agente[campoArray], []);
    
    const novoItem = {
      patrimonio_id: item.id,
      marca: item.marca,
      modelo: item.modelo,
      numero_patrimonio: item.numero_patrimonio,
      numero_serie: item.numero_serie,
      dataCautela: dataCautela,
      ...(item.tipo === 'arma' && {
        calibre: item.calibre,
        craf: item.craf,
        carregador: item.capacidade_carregador || 0,
      }),
      ...(item.tipo === 'colete' && {
        tamanho: item.tamanho,
        sexo: item.sexo,
        validade: item.data_validade,
      }),
    };
    
    arrayAtual.unshift(novoItem);
    
    await supabase
      .from('agentes')
      .update({ [campoArray]: JSON.stringify(arrayAtual) })
      .eq('id', agenteId);
    
    // 5. Registrar no histórico
    await supabase
      .from('historico_patrimonio')
      .insert([{
        item_id: itemId,
        acao: 'cautela',
        agente_id: agenteId,
        agente_nome: agente.Funcional,
        data_movimentacao: new Date().toISOString(),
        observacoes: observacoes,
      }]);
    
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['patrimonio'] });
    queryClient.invalidateQueries({ queryKey: ['agents'] });
    // Disparar evento para sincronizar com agentes
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
    // 1. Buscar o item para saber o tipo
    const { data: item } = await supabase
      .from('patrimonio')
      .select('*')
      .eq('id', itemId)
      .single();
    
    // 2. Atualizar patrimônio
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
    
    // 3. Buscar o agente para remover o item
    const { data: agente } = await supabase
      .from('agentes')
      .select('*')
      .eq('id', agenteId)
      .single();
    
    // 4. Remover do array do agente e adicionar ao histórico
    const campoArray = item.tipo === 'arma' ? 'Armas' : 'Coletes';
    const campoHistorico = item.tipo === 'arma' ? 'Historico Armas' : 'Historico Coletes';
    
    const arrayAtual = parseJsonField(agente[campoArray], []);
    const historicoAtual = parseJsonField(agente[campoHistorico], []);
    
    const index = arrayAtual.findIndex((a: any) => a.patrimonio_id == itemId);
    if (index !== -1) {
      const itemRemovido = arrayAtual[index];
      arrayAtual.splice(index, 1);
      
      historicoAtual.unshift({
        ...itemRemovido,
        dataDevolucao: new Date().toISOString().split('T')[0],
        baixado: false,
      });
      
      await supabase
        .from('agentes')
        .update({
          [campoArray]: JSON.stringify(arrayAtual),
          [campoHistorico]: JSON.stringify(historicoAtual),
        })
        .eq('id', agenteId);
    }
    
    // 5. Registrar no histórico
    await supabase
      .from('historico_patrimonio')
      .insert([{
        item_id: itemId,
        acao: 'devolucao',
        agente_id: agenteId,
        agente_nome: agente.Funcional,
        data_movimentacao: new Date().toISOString(),
        observacoes: observacoes,
      }]);
    
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['patrimonio'] });
    queryClient.invalidateQueries({ queryKey: ['agents'] });
    // Disparar evento para sincronizar com agentes
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