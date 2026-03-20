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
  'Psico Validade': string | null;
  'Porte Validade': string | null;
  'Possui Porte': 'sim' | 'nao';
  'Data Portaria Promocao': string | null;
  'Proxima Promocao': string | null;
  Armas: any[];
  Coletes: any[];
  Municao: any[];
  Certificados: any[];
  'Historico Armas': any[];
  'Historico Coletes': any[];
  'Historico Municao': any[];
}