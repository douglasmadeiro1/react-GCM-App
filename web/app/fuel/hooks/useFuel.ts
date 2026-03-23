'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/services/supabase';
import type { Abastecimento, AbastecimentoFormData, AbastecimentoWithStats } from '../types';

export function useFuel() {
  const queryClient = useQueryClient();

  // Buscar todos os abastecimentos
  const { data: abastecimentos, isLoading, error } = useQuery({
    queryKey: ['abastecimentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('abastecimentos')
        .select('*')
        .order('data_abastecimento', { ascending: false });

      if (error) throw error;
      return data as Abastecimento[];
    },
  });

  // Buscar abastecimentos com filtros
  const getFiltered = async (filters: {
    viatura?: number;
    dataInicio?: string;
    dataFim?: string;
  }) => {
    let query = supabase.from('abastecimentos').select('*');

    if (filters.viatura) {
      query = query.eq('viatura_prefixo', filters.viatura);
    }
    if (filters.dataInicio) {
      query = query.gte('data_abastecimento', filters.dataInicio);
    }
    if (filters.dataFim) {
      query = query.lte('data_abastecimento', filters.dataFim);
    }

    const { data, error } = await query.order('data_abastecimento', { ascending: false });
    if (error) throw error;
    return data as Abastecimento[];
  };

  // Salvar abastecimento
  const saveAbastecimento = useMutation({
    mutationFn: async (data: AbastecimentoFormData) => {
      const payload = {
        ...data,
        created_at: new Date().toISOString(),
      };

      const { data: result, error } = await supabase
        .from('abastecimentos')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return result as Abastecimento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
    },
  });

  // Atualizar abastecimento
  const updateAbastecimento = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AbastecimentoFormData> }) => {
      const { data: result, error } = await supabase
        .from('abastecimentos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Abastecimento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
    },
  });

  // Excluir abastecimento
  const deleteAbastecimento = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('abastecimentos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
    },
  });

  // Buscar viaturas para o select
  const getViaturas = async () => {
    const { data, error } = await supabase
      .from('viaturas')
      .select('id, prefixo, placa')
      .order('prefixo', { ascending: true });

    if (error) throw error;
    return data;
  };

  // Buscar agentes para o select
  const getAgentes = async () => {
    const { data, error } = await supabase
      .from('agentes')
      .select('id, Nome, Funcional, Matricula')
      .order('Funcional', { ascending: true });

    if (error) throw error;
    return data;
  };

  // Calcular KM rodados e consumo (agrupa por viatura)
  const calcularEstatisticas = (abastecimentos: Abastecimento[]): AbastecimentoWithStats[] => {
    // Agrupar por viatura
    const porViatura: Record<number, Abastecimento[]> = {};
    
    abastecimentos.forEach(item => {
      if (!porViatura[item.viatura_prefixo]) {
        porViatura[item.viatura_prefixo] = [];
      }
      porViatura[item.viatura_prefixo].push(item);
    });

    // Processar cada viatura separadamente
    const resultados: AbastecimentoWithStats[] = [];
    
    Object.values(porViatura).forEach(items => {
      // Ordenar por data
      const sorted = [...items].sort((a, b) => 
        new Date(a.data_abastecimento).getTime() - new Date(b.data_abastecimento).getTime()
      );

      let kmAnterior: number | null = null;

      sorted.forEach((item, index) => {
        let kmRodados: number | undefined;
        let consumo: number | undefined;
        let precoPorLitro: number | undefined;

        if (kmAnterior !== null && item.km_atual > kmAnterior) {
          kmRodados = item.km_atual - kmAnterior;
          if (kmRodados > 0 && item.litros > 0) {
            consumo = kmRodados / item.litros;
          }
        }

        precoPorLitro = item.litros > 0 ? item.valor_total / item.litros : undefined;
        kmAnterior = item.km_atual;

        resultados.push({
          ...item,
          km_rodados: kmRodados,
          consumo_km_l: consumo,
          preco_por_litro: precoPorLitro,
        });
      });
    });

    // Ordenar por data decrescente para exibição
    return resultados.sort((a, b) => 
      new Date(b.data_abastecimento).getTime() - new Date(a.data_abastecimento).getTime()
    );
  };

  return {
    abastecimentos,
    isLoading,
    error,
    saveAbastecimento,
    updateAbastecimento,
    deleteAbastecimento,
    getFiltered,
    calcularEstatisticas,
    getViaturas,
    getAgentes,
  };
}