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
      const payload = {
        prefixo: vehicle.prefixo,
        placa: vehicle.placa,
        modelo: vehicle.modelo || null,
        combustivel: vehicle.combustivel || 'Gasolina',
        status: vehicle.status || 'Ativa',
      };
      
      if (vehicle.id) {
        const { data, error } = await supabase
          .from('viaturas')
          .update(payload)
          .eq('id', vehicle.id)
          .select()
          .single();
        if (error) throw error;
        return data as Vehicle;
      } else {
        const { data, error } = await supabase
          .from('viaturas')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        return data as Vehicle;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  // Excluir veículo
  const deleteVehicle = useMutation({
    mutationFn: async (id: number) => {
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