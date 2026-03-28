'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../shared/hooks/useAuth';
import Sidebar from '../../components/Sidebar';

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasError, setHasError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ✅ REDIRECIONAMENTO CORRETO
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // ✅ LOG CONTROLADO
  useEffect(() => {
    if (!user) return;

    console.log('[Dashboard] Estado:', {
      authLoading,
      userNome: user?.nome,
      userNivel: user?.nivel,
      timestamp: new Date().toISOString(),
    });
  }, [authLoading, user]);

  const carregarNotificacoes = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .in('status', ['pendente', 'vencida'])
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        setNotifications(
          data.map((n: any) => ({
            id: n.id,
            message: `Notificação ${n.numero_notificacao} - ${n.natureza}`,
            link: '/notifications',
            type: 'postura',
          }))
        );
      } else {
        setNotifications([]);
      }

      setHasError(false);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      setHasError(true);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      carregarNotificacoes();
    }
  }, [user, carregarNotificacoes]);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Evita múltiplos cliques
    
    setIsLoggingOut(true);
    console.log('[Dashboard] Iniciando logout...');
    
    try {
      await logout();
      console.log('[Dashboard] Logout realizado com sucesso');
      router.push('/login');
    } catch (error) {
      console.error('[Dashboard] Erro no logout:', error);
      setIsLoggingOut(false);
    }
  };

  // ✅ TELA DE LOADING
  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar
          userName="Carregando..."
          userLevel="default"
          onLogout={handleLogout}
        />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </main>
      </div>
    );
  }

  // ✅ BLOQUEIA RENDER SEM USUÁRIO
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        userName={user.nome}
        userLevel={user.nivel}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">
            Bem-vindo, {user.nome}!
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <i className="fa-solid fa-users text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Total de Agentes</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <i className="fa-solid fa-car text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Viaturas Ativas</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <i className="fa-solid fa-file-alt text-yellow-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Documentos</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <i className="fa-solid fa-gavel text-red-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Autuações</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notificações */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Notificações Pendentes</h2>
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-3 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-yellow-800">{notif.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conteúdo adicional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Atividades Recentes</h2>
            <p className="text-gray-500 text-center py-8">
              Nenhuma atividade recente
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Próximos Eventos</h2>
            <p className="text-gray-500 text-center py-8">
              Nenhum evento agendado
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}