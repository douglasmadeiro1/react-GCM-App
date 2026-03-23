'use client';

import type { User, NivelUsuario } from '../types';
import { NIVEL_LABELS } from '../types';

interface UserCardProps {
  user: User;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
}

const nivelColors: Record<NivelUsuario, string> = {
  default: 'bg-gray-100 text-gray-800',
  administrador: 'bg-blue-100 text-blue-800',
  gestor: 'bg-purple-100 text-purple-800',
};

export function UserCard({ user, onClick, onEdit, onDelete, canEdit }: UserCardProps) {
  const getInitials = () => {
    if (user.nome) return user.nome.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {getInitials()}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{user.nome || 'Sem nome'}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${nivelColors[user.nivel_usuario]}`}>
            {NIVEL_LABELS[user.nivel_usuario]}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(user.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>

        {canEdit && (
          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-blue-500 hover:text-blue-700 transition"
              title="Editar"
            >
              <i className="fa-solid fa-pen"></i>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-red-500 hover:text-red-700 transition"
              title="Excluir"
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}