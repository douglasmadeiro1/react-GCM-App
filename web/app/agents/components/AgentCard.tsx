'use client';

import type { Agent } from '../types';

interface AgentCardProps {
  agent: Agent;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
}

export function AgentCard({ agent, onClick, onEdit, onDelete, canEdit }: AgentCardProps) {
  const getStatusClass = () => {
    const hoje = new Date();
    const trintaDias = new Date();
    trintaDias.setDate(hoje.getDate() + 30);

    const psicoValidade = agent["Psico Validade"] ? new Date(agent["Psico Validade"]) : null;
    const porteValidade = agent["Porte Validade"] ? new Date(agent["Porte Validade"]) : null;

    if ((psicoValidade && psicoValidade < hoje) || (porteValidade && porteValidade < hoje)) {
      return 'border-red-500 bg-red-50';
    }
    if ((psicoValidade && psicoValidade <= trintaDias) || (porteValidade && porteValidade <= trintaDias)) {
      return 'border-yellow-500 bg-yellow-50';
    }

    const promocao = agent["Proxima Promocao"] ? new Date(agent["Proxima Promocao"]) : null;
    if (promocao && promocao <= hoje) {
      return 'border-green-500 bg-green-50';
    }

    return 'border-blue-500';
  };

  const formatarData = (data: string | null) => {
    if (!data) return 'N/D';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border-l-4 ${getStatusClass()} overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{agent.Funcional || agent.Nome}</h3>
            <p className="text-sm text-gray-600">{agent.Graduacao}</p>
          </div>
          <span className="text-sm text-gray-500">{agent.Matricula}</span>
        </div>

        {agent["Possui Porte"] === 'nao' && (
          <div className="mt-2 text-xs text-red-600">
            <i className="fa-solid fa-gun-slash mr-1"></i> Sem porte de arma
          </div>
        )}

        {agent["Proxima Promocao"] && (
          <div className="mt-1 text-xs">
            <span className="text-gray-500">Próxima promoção:</span>{' '}
            <span className="font-medium">{formatarData(agent["Proxima Promocao"])}</span>
          </div>
        )}

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