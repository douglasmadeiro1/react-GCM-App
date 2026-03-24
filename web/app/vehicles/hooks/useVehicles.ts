'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/services/supabase';
import type { Vehicle } from '../types';

export function useVehicles() {
  const queryClient = useQueryClient();

  // Buscar todos os veículos
  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('viaturas')
        .select('*')
        .order('prefixo', { ascending: true });

      if (error) throw error;
      return data as Vehicle[];
    },
  });

  // Buscar um veículo específico
  const getVehicle = async (id: number): Promise<Vehicle | null> => {
    const { data, error } = await supabase
      .from('viaturas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Vehicle;
  };

  // Salvar (criar ou atualizar) veículo
  const saveVehicle = useMutation({
    mutationFn: async (vehicle: Partial<Vehicle>) => {
      console.log('=== SALVANDO VEÍCULO ===');
      console.log('Dados recebidos:', vehicle);
      console.log('ID recebido:', vehicle.id);
      console.log('Tipo do ID:', typeof vehicle.id);
      
      const payload = {
        prefixo: vehicle.prefixo,
        placa: vehicle.placa,
        modelo: vehicle.modelo || null,
        combustivel: vehicle.combustivel || 'Gasolina',
        status: vehicle.status || 'Ativa',
      };
      
      // Verificar se é uma atualização (tem ID)
      if (vehicle.id && vehicle.id > 0) {
        console.log('→ ATUALIZANDO veículo ID:', vehicle.id);
        
        const { data, error } = await supabase
          .from('viaturas')
          .update(payload)
          .eq('id', vehicle.id)
          .select()
          .single();
        
        if (error) {
          console.error('Erro na atualização:', error);
          throw error;
        }
        
        console.log('Atualização bem-sucedida:', data);
        return data as Vehicle;
      } else {
        // Criar novo veículo
        console.log('→ CRIANDO novo veículo');
        
        const { data, error } = await supabase
          .from('viaturas')
          .insert([payload])
          .select()
          .single();
        
        if (error) {
          console.error('Erro na criação:', error);
          throw error;
        }
        
        console.log('Criação bem-sucedida:', data);
        return data as Vehicle;
      }
    },
    onSuccess: (data) => {
      console.log('Mutation onSuccess:', data);
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error) => {
      console.error('Mutation onError:', error);
    },
  });

  // Excluir veículo
  const deleteVehicle = useMutation({
    mutationFn: async (id: number) => {
      console.log('Excluindo veículo ID:', id);
      const { error } = await supabase
        .from('viaturas')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  return {
    vehicles,
    isLoading,
    error,
    saveVehicle,
    deleteVehicle,
    getVehicle,
  };
}