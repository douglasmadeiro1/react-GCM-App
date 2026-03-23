'use client';

import { useState, useEffect } from 'react';
import type { Infringement, InfringementFormData } from '../types';

interface InfringementFormProps {
  isOpen: boolean;
  onClose: () => void;
  infringement?: Infringement | null;
  agentes: { id: number; Nome: string; Funcional: string }[];
  onSave: (data: InfringementFormData) => Promise<void>;
  onUpdate?: (id: number, data: Partial<InfringementFormData>) => Promise<void>;
}

export function InfringementForm({ 
  isOpen, 
  onClose, 
  infringement, 
  agentes, 
  onSave, 
  onUpdate 
}: InfringementFormProps) {
  const [formData, setFormData] = useState<InfringementFormData>({
    numero_autuacao: '',
    data_autuacao: new Date().toISOString().split('T')[0],
    agente: '',
    autuado: '',
    cpf: '',
    endereco: '',
    natureza: '',
    prazo_dias: 30,
    atendente: '',
    maps_link: '',
    status: 'pendente',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const naturezas = [
    'Fogo em terreno',
    'Fogo em fios',
    'Descarte irregular de resíduos',
    'Perturbação de sossego',
    'Falta de alvará de funcionamento',
    'Uso de cerol',
    'Obstrução do passeio público',
    'Mato alto',
    'Poda drástica',
    'Veículo em estado de abandono',
  ];

  useEffect(() => {
    if (infringement) {
      setFormData({
        numero_autuacao: infringement.numero_autuacao,
        data_autuacao: infringement.data_autuacao,
        agente: infringement.agente || '',
        autuado: infringement.autuado,
        cpf: infringement.cpf || '',
        endereco: infringement.endereco || '',
        natureza: infringement.natureza || '',
        prazo_dias: infringement.prazo_dias || 30,
        atendente: infringement.atendente || '',
        maps_link: infringement.maps_link || '',
        status: infringement.status,
      });
    } else {
      setFormData({
        numero_autuacao: '',
        data_autuacao: new Date().toISOString().split('T')[0],
        agente: '',
        autuado: '',
        cpf: '',
        endereco: '',
        natureza: '',
        prazo_dias: 30,
        atendente: '',
        maps_link: '',
        status: 'pendente',
      });
    }
    setError('');
  }, [infringement]);

  const formatarCPF = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        .slice(0, 14);
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.numero_autuacao) {
      setError('Número da autuação é obrigatório');
      setLoading(false);
      return;
    }
    if (!formData.autuado) {
      setError('Nome do autuado é obrigatório');
      setLoading(false);
      return;
    }
    if (!formData.data_autuacao) {
      setError('Data da autuação é obrigatória');
      setLoading(false);
      return;
    }

    try {
      if (infringement && onUpdate) {
        await onUpdate(infringement.id, formData);
      } else {
        await onSave(formData);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar autuação');
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
              {infringement ? 'Editar Autuação' : 'Nova Autuação'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número da Autuação *</label>
                <input
                  type="text"
                  value={formData.numero_autuacao}
                  onChange={(e) => setFormData({ ...formData, numero_autuacao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data da Autuação *</label>
                <input
                  type="date"
                  value={formData.data_autuacao}
                  onChange={(e) => setFormData({ ...formData, data_autuacao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agente Fiscalizador</label>
                <select
                  value={formData.agente || ''}
                  onChange={(e) => setFormData({ ...formData, agente: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um agente</option>
                  {agentes.map((a) => (
                    <option key={a.id} value={a.Funcional}>
                      {a.Funcional} - {a.Nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Atendente</label>
                <input
                  type="text"
                  value={formData.atendente || ''}
                  onChange={(e) => setFormData({ ...formData, atendente: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Autuado *</label>
                <input
                  type="text"
                  value={formData.autuado}
                  onChange={(e) => setFormData({ ...formData, autuado: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input
                  type="text"
                  value={formData.cpf || ''}
                  onChange={(e) => setFormData({ ...formData, cpf: formatarCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo (dias)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.prazo_dias || 0}
                  onChange={(e) => setFormData({ ...formData, prazo_dias: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={formData.endereco || ''}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Natureza</label>
                <select
                  value={formData.natureza || ''}
                  onChange={(e) => setFormData({ ...formData, natureza: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione a natureza</option>
                  {naturezas.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Google Maps</label>
                <input
                  type="url"
                  value={formData.maps_link || ''}
                  onChange={(e) => setFormData({ ...formData, maps_link: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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