'use client';

import { useState, useEffect } from 'react';
import type { User, UserFormData, NivelUsuario } from '../types';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  authUsers?: { id: string; email: string }[];
  onSave: (data: UserFormData) => Promise<void>;
}

export function UserForm({ isOpen, onClose, user, authUsers = [], onSave }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    id: '',
    nome: '',
    email: '',
    nivel_usuario: 'default',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        nome: user.nome || '',
        email: user.email,
        nivel_usuario: user.nivel_usuario,
      });
    } else {
      setFormData({
        id: '',
        nome: '',
        email: '',
        nivel_usuario: 'default',
      });
    }
    setError('');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.id && !formData.email) {
      setError('Preencha o ID do usuário e email');
      setLoading(false);
      return;
    }

    if (!formData.id) {
      setError('ID do usuário é obrigatório');
      setLoading(false);
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const niveis: NivelUsuario[] = ['default', 'administrador', 'gestor'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {user ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID do Usuário *</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="UUID do usuário (ex: 30bd7dae-08cd-411b-8cc1-36102891e0b2)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">ID gerado automaticamente pelo Supabase Auth</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Acesso</label>
              <select
                value={formData.nivel_usuario}
                onChange={(e) => setFormData({ ...formData, nivel_usuario: e.target.value as NivelUsuario })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">👤 Usuário Padrão</option>
                <option value="administrador">🔧 Administrador</option>
                <option value="gestor">⭐ Gestor</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}