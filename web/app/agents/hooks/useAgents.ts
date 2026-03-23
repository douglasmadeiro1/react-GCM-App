'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/services/supabase';
import type { Agent } from '../types';

// Funções auxiliares para serializar/deserializar JSON
function parseJsonField(field: any, defaultValue: any = []): any {
  if (!field) return defaultValue;
  try {
    return typeof field === 'string' ? JSON.parse(field) : field;
  } catch {
    return defaultValue;
  }
}

function serializeAgent(agent: Partial<Agent>) {
  return {
    id: agent.id,
    Nome: agent.Nome,
    Funcional: agent.Funcional,
    Cpf: agent.Cpf,
    Nascimento: agent.Nascimento,
    Matricula: agent.Matricula,
    Graduacao: agent.Graduacao,
    Telefone: agent.Telefone,
    Endereco: agent.Endereco,
    "Psico Validade": agent["Psico Validade"],
    "Porte Validade": agent["Porte Validade"],
    "Possui Porte": agent["Possui Porte"],
    "Data Portaria Promocao": agent["Data Portaria Promocao"],
    "Proxima Promocao": agent["Proxima Promocao"],
    Armas: JSON.stringify(agent.Armas || []),
    Coletes: JSON.stringify(agent.Coletes || []),
    Municao: JSON.stringify(agent.Municao || []),
    Certificados: JSON.stringify(agent.Certificados || []),
    "Historico Armas": JSON.stringify(agent["Historico Armas"] || []),
    "Historico Coletes": JSON.stringify(agent["Historico Coletes"] || []),
    "Historico Municao": JSON.stringify(agent["Historico Municao"] || []),
  };
}

function deserializeAgent(data: any): Agent {
  return {
    id: data.id,
    Nome: data.Nome || '',
    Funcional: data.Funcional || '',
    Cpf: data.Cpf || '',
    Nascimento: data.Nascimento || null,
    Matricula: data.Matricula || '',
    Graduacao: data.Graduacao || '',
    Telefone: data.Telefone || null,
    Endereco: data.Endereco || null,
    "Psico Validade": data["Psico Validade"] || null,
    "Porte Validade": data["Porte Validade"] || null,
    "Possui Porte": data["Possui Porte"] || 'sim',
    "Data Portaria Promocao": data["Data Portaria Promocao"] || null,
    "Proxima Promocao": data["Proxima Promocao"] || null,
    Armas: parseJsonField(data.Armas, []),
    Coletes: parseJsonField(data.Coletes, []),
    Municao: parseJsonField(data.Municao, []),
    Certificados: parseJsonField(data.Certificados, []),
    "Historico Armas": parseJsonField(data["Historico Armas"], []),
    "Historico Coletes": parseJsonField(data["Historico Coletes"], []),
    "Historico Municao": parseJsonField(data["Historico Municao"], []),
  };
}

export function useAgents() {
  const queryClient = useQueryClient();

  // Buscar todos os agentes
  const { data: agents, isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agentes')
        .select('*')
        .order('Matricula', { ascending: true });  // ← Maiúsculo!

      if (error) throw error;
      return data.map(deserializeAgent);
    },
  });

  // Buscar um agente específico
  const getAgent = async (id: number): Promise<Agent | null> => {
    const { data, error } = await supabase
      .from('agentes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return deserializeAgent(data);
  };

  // Salvar (criar ou atualizar) agente
  const saveAgent = useMutation({
    mutationFn: async (agent: Partial<Agent>) => {
      const payload = serializeAgent(agent);
      
      if (agent.id) {
        const { data, error } = await supabase
          .from('agentes')
          .update(payload)
          .eq('id', agent.id)
          .select()
          .single();
        if (error) throw error;
        return deserializeAgent(data);
      } else {
        const { data, error } = await supabase
          .from('agentes')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        return deserializeAgent(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  // Excluir agente
  const deleteAgent = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('agentes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });

  // Calcular próxima promoção
  const calcularProximaPromocao = (dataPortaria: string | null): string | null => {
    if (!dataPortaria) return null;
    const data = new Date(dataPortaria);
    if (isNaN(data.getTime())) return null;
    data.setFullYear(data.getFullYear() + 3);
    return data.toISOString().split('T')[0];
  };

  return {
    agents,
    isLoading,
    error,
    saveAgent,
    deleteAgent,
    calcularProximaPromocao,
    getAgent,
  };
}