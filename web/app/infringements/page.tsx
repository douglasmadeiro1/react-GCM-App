'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../shared/hooks/useAuth';
import { useInfringements } from './hooks/useInfringements';
import { InfringementForm } from './components/InfringementForm';
import Sidebar from '../../components/Sidebar';
import type { Infringement, StatusAutuacao } from './types';

export default function InfringementsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { 
    infringements, 
    isLoading, 
    saveInfringement, 
    updateInfringement, 
    updateStatus, 
    deleteInfringement,
    getAgentes,
    atualizarStatusAutomatico
  } = useInfringements();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterNatureza, setFilterNatureza] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInfringement, setSelectedInfringement] = useState<Infringement | null>(null);
  const [agentes, setAgentes] = useState<any[]>([]);

  const canEdit = user?.nivel === 'gestor';

  useEffect(() => {
    const loadAgentes = async () => {
      const a = await getAgentes();
      setAgentes(a || []);
    };
    loadAgentes();
    // Atualizar status automaticamente a cada 5 minutos
    const interval = setInterval(atualizarStatusAutomatico, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Extrair naturezas únicas para filtro
  const naturezas = [...new Set(infringements?.map(i => i.natureza).filter(Boolean))];

  const filteredInfringements = infringements?.filter((item) => {
    const matchSearch = !search || 
      item.numero_autuacao?.toLowerCase().includes(search.toLowerCase()) ||
      item.autuado?.toLowerCase().includes(search.toLowerCase()) ||
      item.cpf?.includes(search) ||
      item.agente?.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = !filterStatus || item.status === filterStatus;
    const matchNatureza = !filterNatureza || item.natureza === filterNatureza;
    
    return matchSearch && matchStatus && matchNatureza;
  });

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta autuação?')) {
      await deleteInfringement.mutateAsync(id);
    }
  };

  const handleDespachar = async (id: number) => {
    if (confirm('Confirmar despacho desta autuação?')) {
      await updateStatus.mutateAsync({ id, status: 'despachado' });
    }
  };

  const handleMarcarVencido = async (id: number) => {
    if (confirm('Marcar esta autuação como vencida?')) {
      await updateStatus.mutateAsync({ id, status: 'vencido' });
    }
  };

  const getStatusColor = (status: StatusAutuacao) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'vencido': return 'bg-red-100 text-red-800';
      case 'despachado': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: StatusAutuacao) => {
    switch (status) {
      case 'pendente': return '⏳ Pendente';
      case 'vencido': return '⚠️ Vencido';
      case 'despachado': return '✅ Despachado';
      default: return status;
    }
  };

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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar userName={user.nome} userLevel={user.nivel} onLogout={handleLogout} />

      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Autos de Infração</h1>
          <p className="text-gray-600">Gerenciamento de autuações</p>
        </div>

        {/* Filtros e ações */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Buscar por número, autuado, CPF ou agente..."
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
            <option value="pendente">⏳ Pendente</option>
            <option value="vencido">⚠️ Vencido</option>
            <option value="despachado">✅ Despachado</option>
          </select>

          <select
            value={filterNatureza}
            onChange={(e) => setFilterNatureza(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as Naturezas</option>
            {naturezas.map((n) => (
              <option key={n} value={n || ''}>
                {n || 'Sem natureza'}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setFilterStatus('');
              setFilterNatureza('');
              setSearch('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Limpar Filtros
          </button>

          {canEdit && (
            <button
              onClick={() => {
                setSelectedInfringement(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 ml-auto"
            >
              <i className="fa-solid fa-plus"></i> Nova Autuação
            </button>
          )}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Número</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Agente</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Autuado</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">CPF</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Natureza</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Prazo</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Ações</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInfringements?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{item.numero_autuacao}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(item.data_autuacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm">{item.agente || '-'}</td>
                    <td className="px-4 py-3 text-sm">{item.autuado}</td>
                    <td className="px-4 py-3 text-sm">{item.cpf || '-'}</td>
                    <td className="px-4 py-3 text-sm">{item.natureza || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.prazo_dias || '-'} dias</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {canEdit && (
                        <div className="flex justify-center gap-2">
                          {item.status !== 'despachado' && (
                            <>
                              <button
                                onClick={() => handleDespachar(item.id)}
                                className="text-green-500 hover:text-green-700"
                                title="Despachar"
                              >
                                <i className="fa-solid fa-paper-plane"></i>
                              </button>
                              {item.status === 'pendente' && (
                                <button
                                  onClick={() => handleMarcarVencido(item.id)}
                                  className="text-orange-500 hover:text-orange-700"
                                  title="Marcar como Vencido"
                                >
                                  <i className="fa-solid fa-calendar-times"></i>
                                </button>
                              )}
                            </>
                          )}
                          <button
                            onClick={() => {
                              setSelectedInfringement(item);
                              setIsModalOpen(true);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                            title="Editar"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Excluir"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredInfringements?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <i className="fa-solid fa-file-signature text-4xl mb-3 opacity-50"></i>
              <p>Nenhuma autuação encontrada</p>
            </div>
          )}
        </div>

        {/* Modal */}
        <InfringementForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedInfringement(null);
          }}
          infringement={selectedInfringement}
          agentes={agentes}
          onSave={async (data) => {
            await saveInfringement.mutateAsync(data);
            setIsModalOpen(false);
          }}
          onUpdate={async (id, data) => {
            await updateInfringement.mutateAsync({ id, data });
            setIsModalOpen(false);
          }}
        />
      </main>
    </div>
  );
}