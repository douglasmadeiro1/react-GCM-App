'use client';

import { useState, useEffect } from 'react';
import type { PatrimonioItem, TipoItem } from '../types';

interface PatrimonioFormProps {
  isOpen: boolean;
  onClose: () => void;
  item: PatrimonioItem | null;
  onSave: (data: Partial<PatrimonioItem>) => Promise<void>;
}

export function PatrimonioForm({ isOpen, onClose, item, onSave }: PatrimonioFormProps) {
  const [tipo, setTipo] = useState<TipoItem>('arma');
  const [formData, setFormData] = useState<Partial<PatrimonioItem>>({
    tipo: 'arma',
    status: 'disponivel',
    marca: '',
    modelo: '',
    numero_patrimonio: '',
    numero_serie: '',
    calibre: '',
    craf: '',
    capacidade_carregador: 0,
    tamanho: '',
    sexo: '',
    data_validade: '',
    data_aquisicao: '',
    observacoes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setTipo(item.tipo);
      setFormData({
        ...item,
        data_validade: item.data_validade || '',
        data_aquisicao: item.data_aquisicao || '',
      });
    } else {
      setTipo('arma');
      setFormData({
        tipo: 'arma',
        status: 'disponivel',
        marca: '',
        modelo: '',
        numero_patrimonio: '',
        numero_serie: '',
        calibre: '',
        craf: '',
        capacidade_carregador: 0,
        tamanho: '',
        sexo: '',
        data_validade: '',
        data_aquisicao: '',
        observacoes: '',
      });
    }
    setError('');
  }, [item]);

  const handleTipoChange = (novoTipo: TipoItem) => {
    setTipo(novoTipo);
    setFormData({ ...formData, tipo: novoTipo });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.marca?.trim()) {
      setError('Marca é obrigatória');
      setLoading(false);
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar item');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {item ? 'Editar Item' : 'Novo Item'}
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
            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="arma"
                    checked={tipo === 'arma'}
                    onChange={() => handleTipoChange('arma')}
                    className="w-4 h-4"
                  />
                  <span>🔫 Arma</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="colete"
                    checked={tipo === 'colete'}
                    onChange={() => handleTipoChange('colete')}
                    className="w-4 h-4"
                  />
                  <span>🛡️ Colete</span>
                </label>
              </div>
            </div>

            {/* Dados comuns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
                <input
                  type="text"
                  value={formData.marca || ''}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                <input
                  type="text"
                  value={formData.modelo || ''}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº Patrimônio</label>
                <input
                  type="text"
                  value={formData.numero_patrimonio || ''}
                  onChange={(e) => setFormData({ ...formData, numero_patrimonio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nº Série</label>
                <input
                  type="text"
                  value={formData.numero_serie || ''}
                  onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Campos específicos para Arma */}
            {tipo === 'arma' && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Especificações da Arma</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calibre</label>
                    <input
                      type="text"
                      placeholder="Ex: .40, 9mm"
                      value={formData.calibre || ''}
                      onChange={(e) => setFormData({ ...formData, calibre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CRAF</label>
                    <input
                      type="text"
                      value={formData.craf || ''}
                      onChange={(e) => setFormData({ ...formData, craf: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carregadores</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.capacidade_carregador || 0}
                      onChange={(e) => setFormData({ ...formData, capacidade_carregador: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Campos específicos para Colete */}
            {tipo === 'colete' && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Especificações do Colete</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho</label>
                    <select
                      value={formData.tamanho || ''}
                      onChange={(e) => setFormData({ ...formData, tamanho: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione</option>
                      <option value="PP">PP - Extra Pequeno</option>
                      <option value="P">P - Pequeno</option>
                      <option value="M">M - Médio</option>
                      <option value="G">G - Grande</option>
                      <option value="GG">GG - Extra Grande</option>
                      <option value="XG">XG - Extra Extra Grande</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                    <select
                      value={formData.sexo || ''}
                      onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Unissex">Unissex</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Validade</label>
                    <input
                      type="date"
                      value={formData.data_validade || ''}
                      onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                rows={3}
                value={formData.observacoes || ''}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Informações adicionais..."
              />
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