'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/services/supabase';
import type { Notification, NotificationFormData, StatusNotificacao } from '../types';

export function useNotifications() {
  const queryClient = useQueryClient();

  // Buscar todas as notificações
  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .order('data_notificacao', { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
  });

  // Buscar notificações pendentes/vencidas (para o sino)
  const getPendingNotifications = async (): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .in('status', ['pendente', 'vencida'])
      .order('data_notificacao', { ascending: false });

    if (error) throw error;
    return data as Notification[];
  };

  // Buscar notificação específica
  const getNotification = async (id: string): Promise<Notification | null> => {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Notification;
  };

  // Salvar notificação
  const saveNotification = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      // Calcular status baseado no prazo
      const hoje = new Date();
      const dataNotificacao = new Date(data.data_notificacao);
      const dataLimite = new Date(dataNotificacao);
      dataLimite.setDate(dataLimite.getDate() + data.prazo_dias);
      
      let status: StatusNotificacao = 'pendente';
      if (hoje > dataLimite) {
        status = 'vencida';
      }

      const payload = {
        ...data,
        status,
      };

      const { data: result, error } = await supabase
        .from('notificacoes')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return result as Notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Atualizar notificação
  const updateNotification = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NotificationFormData> }) => {
      const payload = { ...data };
      
      // Recalcular status se data ou prazo foram alterados
      if (data.data_notificacao || data.prazo_dias !== undefined) {
        const dataNotificacao = data.data_notificacao || (await getNotification(id))?.data_notificacao;
        const prazoDias = data.prazo_dias !== undefined ? data.prazo_dias : (await getNotification(id))?.prazo_dias;
        
        if (dataNotificacao && prazoDias) {
          const hoje = new Date();
          const dataLimite = new Date(dataNotificacao);
          dataLimite.setDate(dataLimite.getDate() + prazoDias);
          
          if (hoje > dataLimite) {
            (payload as any).status = 'vencida';
          }
        }
      }

      const { data: result, error } = await supabase
        .from('notificacoes')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Atualizar status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusNotificacao }) => {
      const { data: result, error } = await supabase
        .from('notificacoes')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as Notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Excluir notificação
  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notificacoes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Marcar todas como cumpridas
  const markAllAsCompleted = useMutation({
    mutationFn: async () => {
      const { data: pending } = await supabase
        .from('notificacoes')
        .select('id')
        .in('status', ['pendente', 'vencida']);

      if (pending && pending.length > 0) {
        const ids = pending.map(p => p.id);
        const { error } = await supabase
          .from('notificacoes')
          .update({ status: 'cumprida' })
          .in('id', ids);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Calcular status baseado no prazo
  const calcularStatus = (dataNotificacao: string, prazoDias: number): StatusNotificacao => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataNot = new Date(dataNotificacao);
    dataNot.setHours(0, 0, 0, 0);
    
    const dataLimite = new Date(dataNot);
    dataLimite.setDate(dataLimite.getDate() + prazoDias);
    
    if (hoje > dataLimite) return 'vencida';
    return 'pendente';
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
    notifications,
    isLoading,
    error,
    saveNotification,
    updateNotification,
    updateStatus,
    deleteNotification,
    markAllAsCompleted,
    getPendingNotifications,
    getNotification,
    calcularStatus,
    getAgentes,
  };
}