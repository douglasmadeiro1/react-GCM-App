export type NivelUsuario = 'default' | 'administrador' | 'gestor';

export interface User {
  id: string;
  email: string;
  nome: string | null;
  nivel_usuario: NivelUsuario;
  created_at: string;
  updated_at: string;
}

export interface UserFormData {
  id: string;
  nome: string | null;
  email: string;
  nivel_usuario: NivelUsuario;
}

export const NIVEL_LABELS: Record<NivelUsuario, string> = {
  default: '👤 Usuário Padrão',
  administrador: '🔧 Administrador',
  gestor: '⭐ Gestor',
};

export const NIVEL_PERMISSOES: Record<NivelUsuario, string[]> = {
  default: ['Visualizar dados'],
  administrador: ['Visualizar dados', 'Editar agentes', 'Exportar dados'],
  gestor: ['Visualizar dados', 'Editar agentes', 'Exportar dados', 'Gerenciar usuários', 'Excluir registros'],
};