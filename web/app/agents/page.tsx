'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../shared/hooks/useAuth';
import { useAgents } from './hooks/useAgents';
import { AgentCard } from './components/AgentCard';
import { AgentForm } from './components/AgentForm';
import Sidebar from '../../components/Sidebar';

export default function AgentsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { agents, isLoading, saveAgent, deleteAgent } = useAgents();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filterGrad, setFilterGrad] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [viewingAgent, setViewingAgent] = useState<any>(null);

  const canEdit = user?.nivel === 'gestor';

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este agente?')) {
      await deleteAgent.mutateAsync(id);
    }
  };

  const filteredAgents = agents?.filter((agent) => {
    const matchSearch = !search || 
      agent.Funcional?.toLowerCase().includes(search.toLowerCase()) ||
      agent.Nome?.toLowerCase().includes(search.toLowerCase()) ||
      agent.Matricula?.includes(search);
    
    const matchGrad = !filterGrad || agent.Graduacao === filterGrad;
    
    return matchSearch && matchGrad;
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

  const graduacoes = [
    'GCM', '3ª classe A', '3ª classe B', '2ª classe A', '2ª classe B',
    '1ª classe A', '1ª classe B', 'Classe distinta A', 'Classe distinta B',
    'Sub inspetor A', 'Sub inspetor B', 'Inspetor A', 'Inspetor B',
    'Sub comandante', 'Comandante'
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar userName={user.nome} userLevel={user.nivel} onLogout={handleLogout} />
      
      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Cadastro de Agentes</h1>
          <p className="text-gray-600">Gerencie os agentes da Guarda Civil Municipal</p>
        </div>

        {/* Filtros e ações */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Buscar por nome ou matrícula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={filterGrad}
            onChange={(e) => setFilterGrad(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas as Graduações</option>
            {graduacoes.map(grad => (
              <option key={grad} value={grad}>{grad}</option>
            ))}
          </select>

          {canEdit && (
            <button
              onClick={() => {
                setSelectedAgent(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i> Novo Agente
            </button>
          )}

          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2">
            <i className="fa-solid fa-file-excel"></i> Exportar
          </button>
        </div>

        {/* Promoções do Ano */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <i className="fa-solid fa-ranking-star text-yellow-500"></i> Promoções do Ano
          </h3>
          <div className="space-y-2">
            {filteredAgents?.filter(a => {
              const promocao = a["Proxima Promocao"];
              if (!promocao) return false;
              const anoPromocao = new Date(promocao).getFullYear();
              const anoAtual = new Date().getFullYear();
              return anoPromocao === anoAtual;
            }).map(agent => (
              <div key={agent.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{agent.Funcional || agent.Nome} ({agent.Graduacao})</span>
                <span className="text-sm text-gray-500">
                  {agent["Proxima Promocao"]?.split('-').reverse().join('/')}
                </span>
              </div>
            ))}
            {filteredAgents?.filter(a => {
              const promocao = a["Proxima Promocao"];
              if (!promocao) return false;
              const anoPromocao = new Date(promocao).getFullYear();
              const anoAtual = new Date().getFullYear();
              return anoPromocao === anoAtual;
            }).length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhuma promoção prevista para este ano.</p>
            )}
          </div>
        </div>

        {/* Cards de Agentes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAgents?.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => setViewingAgent(agent)}
              onEdit={() => {
                setSelectedAgent(agent);
                setIsModalOpen(true);
              }}
              onDelete={() => handleDelete(agent.id)}
              canEdit={canEdit}
            />
          ))}
        </div>

        {filteredAgents?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <i className="fa-solid fa-users text-4xl mb-3 opacity-50"></i>
            <p>Nenhum agente encontrado</p>
          </div>
        )}

        {/* Modal de Cadastro/Edição */}
        <AgentForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAgent(null);
          }}
          agent={selectedAgent}
          onSave={async (data) => {
            await saveAgent.mutateAsync(data);
            setIsModalOpen(false);
            setSelectedAgent(null);
          }}
        />

        {/* Modal de Visualização - simplificado */}
        {viewingAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{viewingAgent.Nome}</h2>
                  <button
                    onClick={() => setViewingAgent(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <p className="text-gray-600 mb-4">{viewingAgent.Funcional} - {viewingAgent.Graduacao}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Dados Pessoais</h3>
                    <p><strong>CPF:</strong> {viewingAgent.Cpf || 'N/I'}</p>
                    <p><strong>Nascimento:</strong> {viewingAgent.Nascimento?.split('-').reverse().join('/') || 'N/I'}</p>
                    <p><strong>Telefone:</strong> {viewingAgent.Telefone || 'N/I'}</p>
                    <p><strong>Endereço:</strong> {viewingAgent.Endereco || 'N/I'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Dados Funcionais</h3>
                    <p><strong>Matrícula:</strong> {viewingAgent.Matricula}</p>
                    <p><strong>Graduação:</strong> {viewingAgent.Graduacao}</p>
                    <p><strong>Próxima Promoção:</strong> {viewingAgent["Proxima Promocao"]?.split('-').reverse().join('/') || 'N/I'}</p>
                  </div>
                </div>
                
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Documentação</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <p><strong>Exame Psicológico:</strong> {viewingAgent["Psico Validade"]?.split('-').reverse().join('/') || 'N/I'}</p>
                    <p><strong>Porte de Arma:</strong> {viewingAgent["Porte Validade"]?.split('-').reverse().join('/') || 'N/I'}</p>
                    <p><strong>Possui Porte:</strong> {viewingAgent["Possui Porte"] === 'sim' ? 'Sim' : 'Não'}</p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  {canEdit && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedAgent(viewingAgent);
                          setViewingAgent(null);
                          setIsModalOpen(true);
                        }}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Excluir agente?')) {
                            deleteAgent.mutateAsync(viewingAgent.id);
                            setViewingAgent(null);
                          }
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}