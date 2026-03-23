'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/services/supabase';

interface CautelaModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: number;
  itemNome: string;
  onConfirm: (data: {
    agenteId: number;
    dataCautela: string;
    dataPrevista?: string;
    observacoes?: string;
  }) => Promise<void>;
}

interface Agente {
  id: number;
  Nome: string;
  Funcional: string;
  Matricula: string;
}

export function CautelaModal({ isOpen, onClose, itemId, itemNome, onConfirm }: CautelaModalProps) {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [agenteId, setAgenteId] = useState('');
  const [dataCautela, setDataCautela] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      carregarAgentes();
      setDataCautela(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const carregarAgentes = async () => {
    const { data, error } = await supabase
      .from('agentes')
      .select('id, "Nome", "Funcional", "Matricula"')
      .order('Funcional', { ascending: true });

    if (!error && data) {
      setAgentes(data);
    } else {
      console.error('Erro ao carregar agentes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agenteId) {
      setError('Selecione um agente');
      return;
    }
    if (!dataCautela) {
      setError('Data da cautela é obrigatória');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onConfirm({
        agenteId: parseInt(agenteId),
        dataCautela,
        dataPrevista: dataPrevista || undefined,
        observacoes: observacoes || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao cautelar item');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Cautelar Item</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          <p className="text-gray-600 mb-4">
            Cautelar <span className="font-semibold">{itemNome}</span> para um agente
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agente *</label>
              <select
                value={agenteId}
                onChange={(e) => setAgenteId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione um agente</option>
                {agentes.map((agente) => (
                  <option key={agente.id} value={agente.id}>
                    {agente.Funcional || agente.Nome} - {agente.Matricula}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data da Cautela *</label>
              <input
                type="date"
                value={dataCautela}
                onChange={(e) => setDataCautela(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Previsão de Devolução</label>
              <input
                type="date"
                value={dataPrevista}
                onChange={(e) => setDataPrevista(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Motivo da cautela, observações..."
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
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Confirmar Cautela'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}