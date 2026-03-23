export interface Abastecimento {
  id: number;
  viatura_prefixo: number;
  viatura_placa: string | null;
  agente_nome: string | null;
  data_abastecimento: string;
  km_atual: number;
  litros: number;
  valor_total: number;
  created_at: string | null;
}

export interface AbastecimentoWithStats extends Abastecimento {
  km_rodados?: number;
  consumo_km_l?: number;
  preco_por_litro?: number;
}

export type AbastecimentoFormData = Omit<Abastecimento, 'id' | 'created_at'>;