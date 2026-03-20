export interface PatrimonioItem {
  id: number;
  tipo: 'arma' | 'colete';
  status: 'disponivel' | 'cautelado' | 'manutencao' | 'baixado';
  marca: string;
  modelo: string | null;
  numero_patrimonio: string | null;
  numero_serie: string | null;
  calibre?: string | null;
  craf?: string | null;
  capacidade_carregador?: number;
  tamanho?: string | null;
  sexo?: string | null;
  data_validade?: string | null;
  data_aquisicao: string | null;
  data_cautela: string | null;
  data_devolucao_prevista: string | null;
  agente_id: number | null;
  observacoes: string | null;
  criado_em: string;
  criado_por: string;
}