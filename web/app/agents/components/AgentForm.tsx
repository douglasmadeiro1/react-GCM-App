'use client';

import { useState, useEffect } from 'react';
import type { Agent } from '../types';

interface AgentFormProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  onSave: (data: Partial<Agent>) => Promise<void>;
}

export function AgentForm({ isOpen, onClose, agent, onSave }: AgentFormProps) {
  const [formData, setFormData] = useState<Partial<Agent>>({
    Nome: '',
    Funcional: '',
    Cpf: '',
    Nascimento: '',
    Matricula: '',
    Graduacao: '',
    Telefone: '',
    Endereco: '',
    "Psico Validade": '',
    "Porte Validade": '',
    "Possui Porte": 'sim',
    "Data Portaria Promocao": '',
    "Proxima Promocao": '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agent) {
      setFormData({
        ...agent,
        Nascimento: agent.Nascimento || '',
        "Psico Validade": agent["Psico Validade"] || '',
        "Porte Validade": agent["Porte Validade"] || '',
        "Data Portaria Promocao": agent["Data Portaria Promocao"] || '',
        Telefone: agent.Telefone || '',
        Endereco: agent.Endereco || '',
      });
    } else {
      setFormData({
        Nome: '',
        Funcional: '',
        Cpf: '',
        Nascimento: '',
        Matricula: '',
        Graduacao: '',
        Telefone: '',
        Endereco: '',
        "Psico Validade": '',
        "Porte Validade": '',
        "Possui Porte": 'sim',
        "Data Portaria Promocao": '',
        "Proxima Promocao": '',
      });
    }
  }, [agent]);

  const calcularProximaPromocao = (dataPortaria: string) => {
    if (!dataPortaria) return '';
    const data = new Date(dataPortaria);
    if (isNaN(data.getTime())) return '';
    data.setFullYear(data.getFullYear() + 3);
    return data.toISOString().split('T')[0];
  };

  const handleDataPortariaChange = (value: string) => {
    const proxima = calcularProximaPromocao(value);
    setFormData({
      ...formData,
      "Data Portaria Promocao": value,
      "Proxima Promocao": proxima,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      alert('Erro ao salvar agente');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const graduacoes = [
    'GCM', '3ª classe A', '3ª classe B', '2ª classe A', '2ª classe B',
    '1ª classe A', '1ª classe B', 'Classe distinta A', 'Classe distinta B',
    'Sub inspetor A', 'Sub inspetor B', 'Inspetor A', 'Inspetor B',
    'Sub comandante', 'Comandante'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{agent ? 'Editar Agente' : 'Novo Agente'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Pessoais */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Dados Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.Nome || ''}
                    onChange={(e) => setFormData({ ...formData, Nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Funcional</label>
                  <input
                    type="text"
                    value={formData.Funcional || ''}
                    onChange={(e) => setFormData({ ...formData, Funcional: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <input
                    type="text"
                    value={formData.Cpf || ''}
                    onChange={(e) => setFormData({ ...formData, Cpf: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={formData.Nascimento || ''}
                    onChange={(e) => setFormData({ ...formData, Nascimento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Dados Funcionais */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Dados Funcionais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula *</label>
                  <input
                    type="text"
                    required
                    value={formData.Matricula || ''}
                    onChange={(e) => setFormData({ ...formData, Matricula: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Graduação</label>
                  <select
                    value={formData.Graduacao || ''}
                    onChange={(e) => setFormData({ ...formData, Graduacao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    {graduacoes.map(grad => (
                      <option key={grad} value={grad}>{grad}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data da Portaria de Promoção</label>
                  <input
                    type="date"
                    value={formData["Data Portaria Promocao"] || ''}
                    onChange={(e) => handleDataPortariaChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Próxima Promoção</label>
                  <input
                    type="date"
                    value={formData["Proxima Promocao"] || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={formData.Telefone || ''}
                    onChange={(e) => setFormData({ ...formData, Telefone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <input
                    type="text"
                    placeholder="Rua, nº - Bairro"
                    value={formData.Endereco || ''}
                    onChange={(e) => setFormData({ ...formData, Endereco: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Documentação */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Documentação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Validade Exame Psicológico</label>
                  <input
                    type="date"
                    value={formData["Psico Validade"] || ''}
                    onChange={(e) => setFormData({ ...formData, "Psico Validade": e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Validade Porte de Arma</label>
                  <input
                    type="date"
                    value={formData["Porte Validade"] || ''}
                    onChange={(e) => setFormData({ ...formData, "Porte Validade": e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Possui Porte?</label>
                  <select
                    value={formData["Possui Porte"] || 'sim'}
                    onChange={(e) => setFormData({ ...formData, "Possui Porte": e.target.value as 'sim' | 'nao' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
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
                {loading ? 'Salvando...' : 'Salvar Agente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}