'use client';

import { useAuth } from '../../shared/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '../../components/Sidebar';

// Definição dos módulos  
const modules = [
  {
    id: 'agents',
    name: 'Gerenciamento da Equipe',
    description: 'Cadastro e gestão de agentes da GCM',
    icon: '👥',
    path: '/agents',
    permission: 'podeVisualizar',
    color: 'bg-blue-500',
  },
  {
    id: 'patrimonio',
    name: 'Gestão de Patrimônio',
    description: 'Controle de armas, coletes e materiais cautelados',
    icon: '🔫',
    path: '/patrimonio',
    permission: 'podeVisualizar',
    color: 'bg-green-500',
  },
  {
    id: 'vehicles',
    name: 'Gerenciamento de Viaturas',
    description: 'Cadastro e manutenção de viaturas',
    icon: '🚓',
    path: '/vehicles',
    permission: 'podeVisualizar',
    color: 'bg-yellow-500',
  },
  {
    id: 'fuel',
    name: 'Consumo de Combustível',
    description: 'Controle de abastecimentos e consumo',
    icon: '⛽',
    path: '/fuel',
    permission: 'podeVisualizar',
    color: 'bg-orange-500',
  },
  {
    id: 'infringements',
    name: 'Autuações',
    description: 'Gerenciamento de autos de infração',
    icon: '📝',
    path: '/infringements',
    permission: 'podeVisualizar',
    color: 'bg-red-500',
  },
  {
    id: 'notifications',
    name: 'Notificações',
    description: 'Gerenciamento de notificações de postura',
    icon: '🔔',
    path: '/notifications',
    permission: 'podeVisualizar',
    color: 'bg-purple-500',
  },
  {
    id: 'documents',
    name: 'Documentos',
    description: 'Documentos utilizados no dia a dia dos plantões',
    icon: '📄',
    path: '/documents',
    permission: 'podeVisualizar',
    color: 'bg-indigo-500',
  },
  {
    id: 'users',
    name: 'Gerenciamento de Usuários',
    description: 'Cadastro e gerenciamento de usuários do sistema',
    icon: '👤',
    path: '/users',
    permission: 'podeGerenciarUsuarios', // Apenas gestores
    color: 'bg-gray-500',
  },
];

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Filtrar módulos baseado nas permissões do usuário
  const visibleModules = modules.filter(module => {
    if (module.permission === 'podeGerenciarUsuarios') {
      return user.nivel === 'gestor';
    }
    return user.permissoes[module.permission as keyof typeof user.permissoes];
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
          {visibleModules.map((module) => (
            <div
              key={module.id}
              onClick={() => router.push(module.path)}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1 overflow-hidden"
            >
              <div className={`${module.color} h-2`} />
              <div className="p-6">
                <div className="text-4xl mb-4">{module.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {module.name}
                </h3>
                <p className="text-sm text-gray-500">{module.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}