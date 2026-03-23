'use client';

import type { PatrimonioItem } from '../types';

interface PatrimonioCardProps {
  item: PatrimonioItem;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCautelar?: () => void;
  onDevolver?: () => void;
  canEdit: boolean;
}

const statusColors = {
  disponivel: 'bg-green-100 text-green-800',
  cautelado: 'bg-blue-100 text-blue-800',
  manutencao: 'bg-yellow-100 text-yellow-800',
  baixado: 'bg-red-100 text-red-800',
};

const statusLabels = {
  disponivel: '📦 Disponível',
  cautelado: '🔒 Cautelado',
  manutencao: '🔧 Manutenção',
  baixado: '❌ Baixado',
};

export function PatrimonioCard({
  item,
  onClick,
  onEdit,
  onDelete,
  onCautelar,
  onDevolver,
  canEdit,
}: PatrimonioCardProps) {
  const getIcon = () => {
    if (item.tipo === 'arma') return '🔫';
    return '🛡️';
  };

  const getEspecificacoes = () => {
    if (item.tipo === 'arma') {
      return (
        <>
          {item.calibre && <p className="text-xs text-gray-500">Calibre: {item.calibre}</p>}
          {item.craf && <p className="text-xs text-gray-500">CRAF: {item.craf}</p>}
        </>
      );
    }
    return (
      <>
        {item.tamanho && <p className="text-xs text-gray-500">Tamanho: {item.tamanho}</p>}
        {item.sexo && <p className="text-xs text-gray-500">Sexo: {item.sexo}</p>}
        {item.data_validade && (
          <p className="text-xs text-gray-500">Validade: {new Date(item.data_validade).toLocaleDateString('pt-BR')}</p>
        )}
      </>
    );
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden"
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getIcon()}</span>
            <div>
              <h3 className="font-semibold text-lg">{item.marca} {item.modelo || ''}</h3>
              <p className="text-xs text-gray-500">
                {item.numero_patrimonio ? `Patrimônio: ${item.numero_patrimonio}` : 'Sem patrimônio'}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
            {statusLabels[item.status]}
          </span>
        </div>

        <div className="mt-2">
          {getEspecificacoes()}
        </div>

        {item.status === 'cautelado' && item.agente_funcional && (
          <p className="mt-2 text-sm text-blue-600">
            <i className="fa-solid fa-user-shield mr-1"></i>
            {item.agente_funcional}
          </p>
        )}

        {canEdit && (
          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-100">
            {item.status === 'disponivel' && onCautelar && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCautelar();
                }}
                className="text-green-500 hover:text-green-700 transition"
                title="Cautelar"
              >
                <i className="fa-solid fa-hand"></i>
              </button>
            )}
            {item.status === 'cautelado' && onDevolver && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDevolver();
                }}
                className="text-orange-500 hover:text-orange-700 transition"
                title="Devolver"
              >
                <i className="fa-solid fa-rotate-left"></i>
              </button>
            )}
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