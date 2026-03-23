export type StatusNotificacao = 'pendente' | 'vencida' | 'cumprida';

export interface Notification {
  id: string;
  numero_notificacao: string;
  data_notificacao: string;
  agente: string;
  notificado: string;
  cpf: string;
  endereco: string;
  natureza: string;
  atendente: string | null;
  prazo_dias: number;
  status: StatusNotificacao;
  created_at: string;
  updated_at: string;
}

export type NotificationFormData = Omit<Notification, 'id' | 'created_at' | 'updated_at'>;