'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../shared/hooks/useAuth';
import { useVehicles } from './hooks/useVehicles';
import { VehicleCard } from './components/VehicleCard';
import { VehicleForm } from './components/VehicleForm';
import Sidebar from '../../components/Sidebar';

export default function VehiclesPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { vehicles, isLoading, saveVehicle, deleteVehicle } = useVehicles();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [viewingVehicle, setViewingVehicle] = useState<any>(null);

  const canEdit = user?.nivel === 'gestor';

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta viatura?')) {
      await deleteVehicle.mutateAsync(id);
    }
  };

  const filteredVehicles = vehicles?.filter((vehicle) => {
    const matchSearch = !search || 
      vehicle.prefixo?.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.placa?.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.modelo?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = !filterStatus || vehicle.status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar userName={user?.nome || ''} userLevel={user?.nivel || 'default'} onLogout={handleLogout} />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const statusOptions = ['Ativa', 'Manutenção', 'Baixada'];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar userName={user.nome} userLevel={user.nivel} onLogout={handleLogout} />
      
      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Viaturas</h1>
          <p className="text-gray-600">Cadastro e controle da frota municipal</p>
        </div>

        {/* Filtros e ações */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Buscar por prefixo, placa ou modelo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os Status</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {canEdit && (
            <button
              onClick={() => {
                setSelectedVehicle(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i> Nova Viatura
            </button>
          )}
        </div>

        {/* Cards de Viaturas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVehicles?.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onClick={() => setViewingVehicle(vehicle)}
              onEdit={() => {
                setSelectedVehicle(vehicle);
                setIsModalOpen(true);
              }}
              onDelete={() => handleDelete(vehicle.id)}
              canEdit={canEdit}
            />
          ))}
        </div>

        {filteredVehicles?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <i className="fa-solid fa-truck text-4xl mb-3 opacity-50"></i>
            <p>Nenhuma viatura encontrada</p>
          </div>
        )}

        {/* Modal de Cadastro/Edição */}
        <VehicleForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedVehicle(null);
          }}
          vehicle={selectedVehicle}
          onSave={async (data) => {
            await saveVehicle.mutateAsync(data);
            setIsModalOpen(false);
            setSelectedVehicle(null);
          }}
        />

        {/* Modal de Visualização */}
        {viewingVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">Viatura {viewingVehicle.prefixo}</h2>
                  <button
                    onClick={() => setViewingVehicle(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <p className="text-gray-600"><strong>Prefixo:</strong></p>
                    <p className="font-medium">{viewingVehicle.prefixo}</p>
                    
                    <p className="text-gray-600"><strong>Placa:</strong></p>
                    <p className="font-medium">{viewingVehicle.placa}</p>
                    
                    <p className="text-gray-600"><strong>Modelo:</strong></p>
                    <p className="font-medium">{viewingVehicle.modelo || 'Não informado'}</p>
                    
                    <p className="text-gray-600"><strong>Combustível:</strong></p>
                    <p className="font-medium">{viewingVehicle.combustivel}</p>
                    
                    <p className="text-gray-600"><strong>Status:</strong></p>
                    <p className={`font-medium ${viewingVehicle.status === 'Ativa' ? 'text-green-600' : viewingVehicle.status === 'Manutenção' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {viewingVehicle.status}
                    </p>
                    
                    <p className="text-gray-600"><strong>Cadastrado em:</strong></p>
                    <p className="font-medium">
                      {viewingVehicle.created_at ? new Date(viewingVehicle.created_at).toLocaleDateString('pt-BR') : 'N/I'}
                    </p>
                  </div>
                </div>
                
                {canEdit && (
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setSelectedVehicle(viewingVehicle);
                        setViewingVehicle(null);
                        setIsModalOpen(true);
                      }}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Excluir esta viatura?')) {
                          deleteVehicle.mutateAsync(viewingVehicle.id);
                          setViewingVehicle(null);
                        }
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}