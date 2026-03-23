export type TipoItem = 'arma' | 'colete';
export type StatusItem = 'disponivel' | 'cautelado' | 'manutencao' | 'baixado';

export interface PatrimonioItem {
  id: number;
  tipo: TipoItem;
  status: StatusItem;
  marca: string;
  modelo: string | null;
  numero_serie: string | null;
  numero_patrimonio: string | null;
  
  // Campos comuns
  data_aquisicao: string | null;
  observacoes: string | null;
  
  // Campos específicos para armas
  calibre: string | null;
  craf: string | null;
  capacidade_carregador: number | null;
  
  // Campos específicos para coletes
  tamanho: string | null;
  sexo: string | null;
  data_validade: string | null;
  
  // Campos de cautela
  agente_id: number | null;
  data_cautela: string | null;
  data_devolucao_prevista: string | null;
  cautelado_por: string | null;
  
  // Campos de auditoria
  criado_em: string;
  atualizado_em: string;
  criado_por: string | null;
  
  // Campos relacionais (populados pelo frontend)
  agente_nome?: string;
  agente_funcional?: string;
}

export type PatrimonioFormData = Omit<PatrimonioItem, 'id' | 'criado_em' | 'atualizado_em' | 'criado_por'>;