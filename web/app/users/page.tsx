'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../shared/hooks/useAuth';
import { useUsers } from './hooks/useUsers';
import { UserCard } from './components/UserCard';
import { UserForm } from './components/UserForm';
import Sidebar from '../../components/Sidebar';
import type { User } from './types';
import { NIVEL_LABELS } from './types';

export default function UsersPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { users, isLoading, saveUser, deleteUser, updateUserLevel } = useUsers();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filterNivel, setFilterNivel] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  const isGestor = user?.nivel === 'gestor';

  useEffect(() => {
    if (!authLoading && !isGestor) {
      router.push('/dashboard');
      return;
    }
  }, [authLoading, isGestor, router]);

  const canEdit = isGestor;

  const filteredUsers = users?.filter((u: User) => {
    const matchSearch = !search || 
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.nome?.toLowerCase().includes(search.toLowerCase());
    
    const matchNivel = !filterNivel || u.nivel_usuario === filterNivel;
    
    return matchSearch && matchNivel;
  });

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário? O perfil será removido, mas o acesso ao sistema permanecerá.')) {
      await deleteUser.mutateAsync(id);
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

  if (!isGestor) return null;

  const niveis = ['default', 'administrador', 'gestor'];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar userName={user?.nome || ''} userLevel={user?.nivel || 'default'} onLogout={handleLogout} />

      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Usuários</h1>
          <p className="text-gray-600">Cadastro e gerenciamento de usuários do sistema e suas permissões</p>
        </div>

        {/* Filtros e ações */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={filterNivel}
            onChange={(e) => setFilterNivel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os Níveis</option>
            {niveis.map((n) => (
              <option key={n} value={n}>{NIVEL_LABELS[n as keyof typeof NIVEL_LABELS]}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setFilterNivel('');
              setSearch('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Limpar Filtros
          </button>

          {canEdit && (
            <button
              onClick={() => {
                setSelectedUser(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 ml-auto"
            >
              <i className="fa-solid fa-plus"></i> Novo Usuário
            </button>
          )}
        </div>

        {/* Cards de Usuários */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers?.map((userItem: User) => (
            <UserCard
              key={userItem.id}
              user={userItem}
              onClick={() => setViewingUser(userItem)}
              onEdit={() => {
                setSelectedUser(userItem);
                setIsModalOpen(true);
              }}
              onDelete={() => handleDelete(userItem.id)}
              canEdit={canEdit}
            />
          ))}
        </div>

        {filteredUsers?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <i className="fa-solid fa-users text-4xl mb-3 opacity-50"></i>
            <p>Nenhum usuário encontrado</p>
          </div>
        )}

        {/* Modal de Cadastro/Edição */}
        <UserForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          authUsers={[]} // Passando array vazio pois não usamos mais
          onSave={async (data: any) => {
            await saveUser.mutateAsync(data);
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
        />

        {/* Modal de Visualização */}
        {viewingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">Detalhes do Usuário</h2>
                  <button
                    onClick={() => setViewingUser(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {viewingUser.nome?.charAt(0).toUpperCase() || viewingUser.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{viewingUser.nome || 'Sem nome'}</p>
                      <p className="text-gray-500">{viewingUser.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <p className="text-gray-600"><strong>Nível:</strong></p>
                    <p className="font-medium">{NIVEL_LABELS[viewingUser.nivel_usuario]}</p>

                    <p className="text-gray-600"><strong>ID:</strong></p>
                    <p className="text-sm font-mono">{viewingUser.id.substring(0, 20)}...</p>

                    <p className="text-gray-600"><strong>Criado em:</strong></p>
                    <p>{new Date(viewingUser.created_at).toLocaleDateString('pt-BR')}</p>

                    <p className="text-gray-600"><strong>Última atualização:</strong></p>
                    <p>{new Date(viewingUser.updated_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {canEdit && (
                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setSelectedUser(viewingUser);
                        setViewingUser(null);
                        setIsModalOpen(true);
                      }}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Excluir este usuário?')) {
                          deleteUser.mutateAsync(viewingUser.id);
                          setViewingUser(null);
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