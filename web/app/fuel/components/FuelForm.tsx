'use client';

import { useState, useEffect } from 'react';
import type { Abastecimento, AbastecimentoFormData } from '../types';

interface Viatura {
  id: number;
  prefixo: number;
  placa: string;
}

interface Agente {
  id: number;
  Nome: string;
  Funcional: string;
  Matricula: string;
}

interface FuelFormProps {
  isOpen: boolean;
  onClose: () => void;
  abastecimento?: Abastecimento | null;
  viaturas: Viatura[];
  agentes: Agente[];
  onSave: (data: AbastecimentoFormData) => Promise<void>;
  onUpdate?: (id: number, data: Partial<AbastecimentoFormData>) => Promise<void>;
  ultimoKmPorViatura?: Record<number, { km: number; data: string }>;
}

export function FuelForm({ 
  isOpen, 
  onClose, 
  abastecimento, 
  viaturas, 
  agentes, 
  onSave, 
  onUpdate,
  ultimoKmPorViatura = {}
}: FuelFormProps) {
  const [formData, setFormData] = useState<AbastecimentoFormData>({
    viatura_prefixo: 0,
    viatura_placa: '',
    agente_nome: '',
    data_abastecimento: new Date().toISOString().split('T')[0],
    km_atual: 0,
    litros: 0,
    valor_total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viaturaSelecionada, setViaturaSelecionada] = useState<Viatura | null>(null);

  useEffect(() => {
    if (abastecimento) {
      setFormData({
        viatura_prefixo: abastecimento.viatura_prefixo,
        viatura_placa: abastecimento.viatura_placa || '',
        agente_nome: abastecimento.agente_nome || '',
        data_abastecimento: abastecimento.data_abastecimento,
        km_atual: abastecimento.km_atual,
        litros: abastecimento.litros,
        valor_total: abastecimento.valor_total,
      });
      
      const viatura = viaturas.find(v => v.prefixo === abastecimento.viatura_prefixo);
      if (viatura) setViaturaSelecionada(viatura);
    } else {
      setFormData({
        viatura_prefixo: 0,
        viatura_placa: '',
        agente_nome: '',
        data_abastecimento: new Date().toISOString().split('T')[0],
        km_atual: 0,
        litros: 0,
        valor_total: 0,
      });
      setViaturaSelecionada(null);
    }
    setError('');
  }, [abastecimento, viaturas]);

  const handleViaturaChange = (prefixo: number) => {
    const viatura = viaturas.find(v => v.prefixo === prefixo);
    setViaturaSelecionada(viatura || null);
    setFormData({
      ...formData,
      viatura_prefixo: prefixo,
      viatura_placa: viatura?.placa || '',
    });
  };

  const handleAgenteChange = (funcional: string) => {
    const agente = agentes.find(a => a.Funcional === funcional);
    setFormData({
      ...formData,
      agente_nome: agente?.Funcional || funcional,
    });
  };

  const getUltimoKm = () => {
    if (formData.viatura_prefixo && ultimoKmPorViatura[formData.viatura_prefixo]) {
      return ultimoKmPorViatura[formData.viatura_prefixo];
    }
    return null;
  };

  const ultimoKm = getUltimoKm();
  const kmRodados = ultimoKm && formData.km_atual > ultimoKm.km 
    ? formData.km_atual - ultimoKm.km 
    : null;
  const consumo = kmRodados && formData.litros > 0 
    ? (kmRodados / formData.litros).toFixed(2) 
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.viatura_prefixo) {
      setError('Selecione uma viatura');
      setLoading(false);
      return;
    }
    if (!formData.agente_nome) {
      setError('Selecione um agente');
      setLoading(false);
      return;
    }
    if (formData.km_atual <= 0) {
      setError('KM atual deve ser maior que zero');
      setLoading(false);
      return;
    }
    if (formData.litros <= 0) {
      setError('Litros deve ser maior que zero');
      setLoading(false);
      return;
    }
    if (formData.valor_total <= 0) {
      setError('Valor total deve ser maior que zero');
      setLoading(false);
      return;
    }

    if (ultimoKm && formData.km_atual <= ultimoKm.km) {
      if (!confirm(`KM atual (${formData.km_atual}) é menor ou igual ao último registrado (${ultimoKm.km}). Deseja continuar?`)) {
        setLoading(false);
        return;
      }
    }

    try {
      if (abastecimento && onUpdate) {
        await onUpdate(abastecimento.id, formData);
      } else {
        await onSave(formData);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar abastecimento');
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
            <h2 className="text-xl font-bold">
              {abastecimento ? 'Editar Abastecimento' : 'Novo Abastecimento'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Viatura *</label>
              <select
                value={formData.viatura_prefixo || ''}
                onChange={(e) => handleViaturaChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione uma viatura</option>
                {viaturas.map((v) => (
                  <option key={v.id} value={v.prefixo}>
                    {v.prefixo} - {v.placa}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agente Responsável *</label>
              <select
                value={formData.agente_nome || ''}
                onChange={(e) => handleAgenteChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
              <input
                type="date"
                value={formData.data_abastecimento}
                onChange={(e) => setFormData({ ...formData, data_abastecimento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KM Atual *</label>
              <input
                type="number"
                min="0"
                value={formData.km_atual || ''}
                onChange={(e) => setFormData({ ...formData, km_atual: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {ultimoKm && (
                <p className="text-xs text-gray-500 mt-1">
                  Último KM: {ultimoKm.km} ({new Date(ultimoKm.data).toLocaleDateString('pt-BR')})
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Litros *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.litros || ''}
                onChange={(e) => setFormData({ ...formData, litros: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.valor_total || ''}
                onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {kmRodados !== null && consumo !== null && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">KM rodados:</span> {kmRodados} km
                </p>
                <p className="text-sm">
                  <span className="font-medium">Consumo:</span> {consumo} km/l
                </p>
                <p className="text-sm">
                  <span className="font-medium">Preço por litro:</span> R$ {(formData.valor_total / formData.litros).toFixed(2)}
                </p>
              </div>
            )}

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