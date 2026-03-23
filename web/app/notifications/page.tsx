'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../shared/hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { NotificationForm } from './components/NotificationForm';
import { NotificationBell } from './components/NotificationBell';
import Sidebar from '../../components/Sidebar';
import type { Notification, StatusNotificacao } from './types';

export default function NotificationsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { 
    notifications, 
    isLoading, 
    saveNotification, 
    updateNotification, 
    updateStatus, 
    deleteNotification,
    getAgentes
  } = useNotifications();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterNatureza, setFilterNatureza] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [agentes, setAgentes] = useState<any[]>([]);

  const canEdit = user?.nivel === 'gestor';

  useEffect(() => {
    const loadAgentes = async () => {
      const a = await getAgentes();
      setAgentes(a || []);
    };
    loadAgentes();
  }, [getAgentes]);

  // Extrair naturezas únicas para filtro
  const naturezas = notifications ? [...new Set(notifications.map(n => n.natureza).filter(Boolean))] : [];

  const filteredNotifications = notifications?.filter((item) => {
    const matchSearch = !search || 
      item.numero_notificacao?.toLowerCase().includes(search.toLowerCase()) ||
      item.notificado?.toLowerCase().includes(search.toLowerCase()) ||
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

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta notificação?')) {
      await deleteNotification.mutateAsync(id);
    }
  };

  const handleMarkAsCompleted = async (id: string) => {
    await updateStatus.mutateAsync({ id, status: 'cumprida' });
  };

  const getStatusColor = (status: StatusNotificacao) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'vencida': return 'bg-red-100 text-red-800';
      case 'cumprida': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: StatusNotificacao) => {
    switch (status) {
      case 'pendente': return '⏳ Pendente';
      case 'vencida': return '⚠️ Vencida';
      case 'cumprida': return '✅ Cumprida';
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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notificações</h1>
            <p className="text-gray-600">Gerenciamento de notificações de postura</p>
          </div>
          <NotificationBell />
        </div>

        {/* Filtros e ações */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Buscar por número, notificado, CPF ou agente..."
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
            <option value="vencida">⚠️ Vencida</option>
            <option value="cumprida">✅ Cumprida</option>
          </select>

          <select
            value={filterNatureza}
            onChange={(e) => setFilterNatureza(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as Naturezas</option>
            {naturezas.map((n) => (
              <option key={n || 'empty'} value={n || ''}>{n || 'Sem natureza'}</option>
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
                setSelectedNotification(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 ml-auto"
            >
              <i className="fa-solid fa-plus"></i> Nova Notificação
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
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Notificado</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">CPF</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Natureza</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Prazo</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredNotifications?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{item.numero_notificacao}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(item.data_notificacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm">{item.agente}</td>
                    <td className="px-4 py-3 text-sm">{item.notificado}</td>
                    <td className="px-4 py-3 text-sm">{item.cpf}</td>
                    <td className="px-4 py-3 text-sm">{item.natureza}</td>
                    <td className="px-4 py-3 text-sm text-center">{item.prazo_dias} dias</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {canEdit && (
                        <div className="flex justify-center gap-2">
                          {item.status !== 'cumprida' && (
                            <button
                              onClick={() => handleMarkAsCompleted(item.id)}
                              className="text-green-500 hover:text-green-700"
                              title="Marcar como cumprida"
                            >
                              <i className="fa-solid fa-check"></i>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedNotification(item);
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
          {filteredNotifications?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <i className="fa-solid fa-bell text-4xl mb-3 opacity-50"></i>
              <p>Nenhuma notificação encontrada</p>
            </div>
          )}
        </div>

        {/* Modal */}
        <NotificationForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedNotification(null);
          }}
          notification={selectedNotification}
          agentes={agentes}
          onSave={async (data) => {
            await saveNotification.mutateAsync(data);
            setIsModalOpen(false);
          }}
          onUpdate={async (id, data) => {
            await updateNotification.mutateAsync({ id, data });
            setIsModalOpen(false);
          }}
        />
      </main>
    </div>
  );
}