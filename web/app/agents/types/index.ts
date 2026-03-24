export interface Agent {
  id: number;
  Nome: string;
  Funcional: string;
  Cpf: string;
  Nascimento: string | null;
  Matricula: string;
  Graduacao: string;
  Telefone: string | null;
  Endereco: string | null;
  "Psico Validade": string | null;
  "Porte Validade": string | null;
  "Possui Porte": 'sim' | 'nao';
  "Data Portaria Promocao": string | null;
  "Proxima Promocao": string | null;
  Armas: ArmaCautelada[];
  Coletes: ColeteCautelado[];
  Municao: MunicaoCautelada[];
  Certificados: Certificado[];
  "Historico Armas": ArmaHistorico[];
  "Historico Coletes": ColeteHistorico[];
  "Historico Municao": MunicaoHistorico[];
}

export interface ArmaCautelada {
  patrimonio_id: number;
  marca: string;
  modelo: string;
  numero_patrimonio: string;
  numero_serie: string;
  calibre: string;
  craf: string;
  carregador: number;
  dataCautela: string;
  dataDevolucao?: string | null;
  baixado?: boolean;
}

export interface ColeteCautelado {
  patrimonio_id: number;
  marca: string;
  modelo: string;
  numero_patrimonio: string;
  numero_serie: string;
  tamanho: string;
  sexo: string;
  validade: string | null;
  dataCautela: string;
  dataDevolucao?: string | null;
  baixado?: boolean;
}

export interface MunicaoCautelada {
  patrimonio_id?: number;
  marca: string;
  modelo: string;
  calibre: string;
  quantidade: number;
  lote: string | null;
  observacoes: string | null;
  dataCautela: string;
  dataDevolucao?: string | null;
  baixado?: boolean;
}

export interface Certificado {
  titulo: string;
  instituicao: string;
  cargaHoraria: number | null;
  dataConclusao: string;
  dataValidade: string | null;
  tipo: string | null;
  observacoes: string | null;
  imagem?: string | null;
  imagemTipo?: string | null;
  originalFilename?: string | null;
  dataCadastro: string;
}

export interface ArmaHistorico extends ArmaCautelada {
  dataDevolucao: string;
  baixado: boolean;
}

export interface ColeteHistorico extends ColeteCautelado {
  dataDevolucao: string;
  baixado: boolean;
}

export interface MunicaoHistorico extends MunicaoCautelada {
  dataDevolucao: string;
  baixado: boolean;
}