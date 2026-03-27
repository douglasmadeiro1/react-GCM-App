'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';

// Definição dos módulos com tipos
interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  permission: string;
  color: string;
}

const MODULES: Module[] = [
  {
    id: 'documents',
    name: 'Documentos',
    description: 'Documentos utilizados no dia a dia dos plantões',
    icon: '/assets/image/documentos.png',
    path: '/documents',
    permission: 'podeVisualizar',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'notifications',
    name: 'Notificações',
    description: 'Gerenciamento das notificações de postura',
    icon: '/assets/image/notificacao.png',
    path: '/notifications',
    permission: 'podeVisualizar',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'infringements',
    name: 'Autuações',
    description: 'Gerenciamento dos autos de infração',
    icon: '/assets/image/autuacao.png',
    path: '/infringements',
    permission: 'podeVisualizar',
    color: 'from-red-500 to-orange-500',
  },
  {
    id: 'vehicles',
    name: 'Gerenciamento de Viaturas',
    description: 'Cadastro e manutenção de viaturas',
    icon: '/assets/image/viatura.png',
    path: '/vehicles',
    permission: 'podeVisualizar',
    color: 'from-yellow-500 to-amber-500',
  },
  {
    id: 'fuel',
    name: 'Consumo de Combustível',
    description: 'Controle de abastecimentos e consumo',
    icon: '/assets/image/combustivel.png',
    path: '/fuel',
    permission: 'podeVisualizar',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'agents',
    name: 'Gerenciamento da Equipe',
    description: 'Cadastro e gestão de agentes da GCM',
    icon: '/assets/image/equipe.png',
    path: '/agents',
    permission: 'podeVisualizar',
    color: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'patrimonio',
    name: 'Gestão de Patrimônio',
    description: 'Controle de armas, coletes e materiais cautelados',
    icon: '/assets/image/patrimonio.png',
    path: '/patrimonio',
    permission: 'podeVisualizar',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'users',
    name: 'Gerenciamento de Usuários',
    description: 'Cadastro e gerenciamento de usuários do sistema',
    icon: '/assets/image/background-gcm.jpg',
    path: '/users',
    permission: 'podeGerenciarUsuarios',
    color: 'from-gray-500 to-gray-700',
  },
];

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user && !isRedirecting && !hasError) {
      setIsRedirecting(true);
      router.replace('/login');
    }
  }, [user, authLoading, router, isRedirecting, hasError]);
    useEffect(() => {
    console.log('[Dashboard] authLoading:', authLoading, 'user:', user?.nome);
  }, [authLoading, user]);

  const carregarNotificacoes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .in('status', ['pendente', 'vencida'])
        .limit(10);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setNotifications(data.map((n: any) => ({
          id: n.id,
          message: `Notificação ${n.numero_notificacao} - ${n.natureza}`,
          link: '/notifications',
          type: 'postura'
        })));
      } else {
        setNotifications([]);
      }
      setHasError(false);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      setHasError(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      carregarNotificacoes();
    }
  }, [user, carregarNotificacoes]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleRetry = () => {
    carregarNotificacoes();
  };

  // Mostrar loading
  if (authLoading) {
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

  // Se houver erro, mostrar mensagem e botão de recarregar
  if (hasError) {
    return (
      <div className="flex min-h-screen">
        <Sidebar userName={user.nome} userLevel={user.nivel} onLogout={handleLogout} />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center max-w-md">
            <i className="fa-solid fa-circle-exclamation text-5xl text-yellow-500 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro de Conexão</h2>
            <p className="text-gray-600 mb-4">
              Não foi possível carregar alguns dados. Sua sessão continua ativa.
            </p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tentar Novamente
            </button>
          </div>
        </main>
      </div>
    );
  }

  const visibleModules = MODULES.filter((mod) => {
    if (mod.permission === 'podeGerenciarUsuarios') {
      return user.nivel === 'gestor';
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar userName={user.nome} userLevel={user.nivel} onLogout={handleLogout} />
      
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Bem-vindo, {user.nome}! Selecione um módulo para começar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleModules.map((mod) => (
            <div
              key={mod.id}
              onClick={() => router.push(mod.path)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1 overflow-hidden group"
            >
              <div className={`h-2 bg-gradient-to-r ${mod.color}`} />
              <div className="p-6 text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <Image
                    src={mod.icon}
                    alt={mod.name}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform"
                    unoptimized
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {mod.name}
                </h3>
                <p className="text-sm text-gray-500">{mod.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Notificações */}
        <div className="fixed bottom-4 right-4 z-50">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition"
            >
              <i className="fa-solid fa-bell text-xl"></i>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute bottom-14 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-200">
                  <h3 className="font-semibold">Notificações</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <i className="fa-solid fa-check-circle text-2xl mb-2"></i>
                      <p className="text-sm">Nenhuma notificação pendente</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          router.push(notif.link);
                          setShowNotifications(false);
                        }}
                        className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      >
                        <p className="text-sm text-gray-700">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">Clique para visualizar</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}