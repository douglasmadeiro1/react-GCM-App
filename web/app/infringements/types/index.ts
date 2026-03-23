export type StatusAutuacao = 'pendente' | 'vencido' | 'despachado';

export interface Infringement {
  id: number;
  numero_autuacao: string;
  data_autuacao: string;
  agente: string | null;
  autuado: string;
  cpf: string | null;
  endereco: string | null;
  natureza: string | null;
  prazo_dias: number | null;
  atendente: string | null;
  maps_link: string | null;
  status: StatusAutuacao;
  created_at: string;
  updated_at: string;
}

export type InfringementFormData = Omit<Infringement, 'id' | 'created_at' | 'updated_at'>;