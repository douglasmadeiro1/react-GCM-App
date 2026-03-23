'use client';

import { useState, useEffect } from 'react';
import type { Vehicle } from '../types';

interface VehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onSave: (data: Partial<Vehicle>) => Promise<void>;
}

export function VehicleForm({ isOpen, onClose, vehicle, onSave }: VehicleFormProps) {
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    prefixo: '',
    placa: '',
    modelo: '',
    combustivel: 'Gasolina',
    status: 'Ativa',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vehicle) {
      setFormData({
        prefixo: vehicle.prefixo || '',
        placa: vehicle.placa || '',
        modelo: vehicle.modelo || '',
        combustivel: vehicle.combustivel || 'Gasolina',
        status: vehicle.status || 'Ativa',
      });
    } else {
      setFormData({
        prefixo: '',
        placa: '',
        modelo: '',
        combustivel: 'Gasolina',
        status: 'Ativa',
      });
    }
    setError('');
  }, [vehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.prefixo?.trim()) {
      setError('Prefixo é obrigatório');
      setLoading(false);
      return;
    }
    if (!formData.placa?.trim()) {
      setError('Placa é obrigatória');
      setLoading(false);
      return;
    }

    try {
      await onSave({
        ...formData,
        prefixo: formData.prefixo?.toUpperCase() || '',
        placa: formData.placa?.toUpperCase().replace(/-/g, '') || '',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar viatura');
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
            <h2 className="text-xl font-bold">{vehicle ? 'Editar Viatura' : 'Nova Viatura'}</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Prefixo *</label>
              <input
                type="text"
                placeholder="Ex: 01, 02, 03..."
                value={formData.prefixo || ''}
                onChange={(e) => setFormData({ ...formData, prefixo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Placa *</label>
              <input
                type="text"
                placeholder="Ex: ABC1234"
                value={formData.placa || ''}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input
                type="text"
                placeholder="Ex: Ford Ranger, Chevrolet S10..."
                value={formData.modelo || ''}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Combustível</label>
              <select
                value={formData.combustivel || 'Gasolina'}
                onChange={(e) => setFormData({ ...formData, combustivel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Gasolina">Gasolina</option>
                <option value="Etanol">Etanol</option>
                <option value="Diesel">Diesel</option>
                <option value="Flex">Flex</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status || 'Ativa'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Ativa">Ativa</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Baixada">Baixada</option>
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