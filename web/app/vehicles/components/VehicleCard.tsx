'use client';

import type { Vehicle } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
}

const statusColors: Record<string, string> = {
  'Ativa': 'bg-green-100 text-green-800',
  'Manutenção': 'bg-yellow-100 text-yellow-800',
  'Baixada': 'bg-red-100 text-red-800',
};

export function VehicleCard({ vehicle, onClick, onEdit, onDelete, canEdit }: VehicleCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden"
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{vehicle.prefixo}</h3>
            <p className="text-sm text-gray-600">{vehicle.modelo || 'Sem modelo'}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[vehicle.status || 'Ativa']}`}>
            {vehicle.status || 'Ativa'}
          </span>
        </div>

        <p className="text-sm text-gray-500 mt-2">
          <span className="font-medium">Placa:</span> {vehicle.placa}
        </p>
        <p className="text-sm text-gray-500">
          <span className="font-medium">Combustível:</span> {vehicle.combustivel || 'Gasolina'}
        </p>

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