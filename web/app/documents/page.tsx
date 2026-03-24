'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../../shared/hooks/useAuth';
import Sidebar from '../../components/Sidebar';

export default function DocumentsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar userName={user.nome} userLevel={user.nivel} onLogout={handleLogout} />

      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Documentos</h1>
          <p className="text-gray-600">Documentos utilizados no dia a dia dos plantões</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <i className="fa-solid fa-file-pdf text-6xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-semibold mb-2">Módulo em Desenvolvimento</h2>
          <p className="text-gray-500">Em breve, documentos e formulários estarão disponíveis aqui.</p>
        </div>
      </main>
    </div>
  );
}