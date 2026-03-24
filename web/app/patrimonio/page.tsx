'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../shared/hooks/useAuth';
import { usePatrimonio } from './hooks/usePatrimonio';
import { PatrimonioCard } from './components/PatrimonioCard';
import { PatrimonioForm } from './components/PatrimonioForm';
import { CautelaModal } from './components/CautelaModal';
import Sidebar from '../../components/Sidebar';
import type { PatrimonioItem } from './types';
import { supabase } from '../../shared/services/supabase';


export default function PatrimonioPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { 
    items, 
    isLoading, 
    saveItem, 
    deleteItem, 
    cautelarItem, 
    devolverItem,
    getHistorico 
  } = usePatrimonio();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PatrimonioItem | null>(null);
  const [cautelaItem, setCautelaItem] = useState<PatrimonioItem | null>(null);
  const [viewingItem, setViewingItem] = useState<PatrimonioItem | null>(null);
  const [historicoItem, setHistoricoItem] = useState<PatrimonioItem | null>(null);
  const [historicoList, setHistoricoList] = useState<any[]>([]);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [activeHistoricoTab, setActiveHistoricoTab] = useState(false);
  const [historicoModalList, setHistoricoModalList] = useState<any[]>([]);

  const canEdit = user?.nivel === 'gestor';

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      await deleteItem.mutateAsync(id);
    }
  };

  const handleCautelar = (item: PatrimonioItem) => {
    setCautelaItem(item);
  };

  const handleDevolver = async (item: PatrimonioItem) => {
    if (!item.agente_id) return;
    if (confirm(`Devolver ${item.marca} ${item.modelo || ''} ao estoque?`)) {
      await devolverItem.mutateAsync({
        itemId: item.id,
        agenteId: item.agente_id,
      });
    }
  };

  const handleConfirmCautela = async (data: {
    agenteId: number;
    dataCautela: string;
    dataPrevista?: string;
    observacoes?: string;
  }) => {
    if (!cautelaItem) return;
    await cautelarItem.mutateAsync({
      itemId: cautelaItem.id,
      ...data,
    });
    setCautelaItem(null);
  };

  const carregarHistorico = async (item: PatrimonioItem) => {
    setHistoricoItem(item);
    setShowHistoricoModal(true);
    
    try {
      const historico = await getHistorico(item.id);
      setHistoricoList(historico || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setHistoricoList([]);
    }
  };

  const carregarHistoricoParaModal = async (itemId: number) => {
  try {
    const { data, error } = await supabase
      .from('historico_patrimonio')
      .select('*')
      .eq('item_id', itemId)
      .order('data_movimentacao', { ascending: false });
    
    if (error) throw error;
    setHistoricoModalList(data || []);
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    setHistoricoModalList([]);
  }
};

// Quando abrir o modal de visualização, resetar a aba
useEffect(() => {
  if (viewingItem) {
    setActiveHistoricoTab(false);
  }
}, [viewingItem]);

  const filteredItems = items?.filter((item) => {
    const matchSearch = !search ||
      item.marca?.toLowerCase().includes(search.toLowerCase()) ||
      item.modelo?.toLowerCase().includes(search.toLowerCase()) ||
      item.numero_patrimonio?.toLowerCase().includes(search.toLowerCase());

    const matchTipo = !filterTipo || item.tipo === filterTipo;
    const matchStatus = !filterStatus || item.status === filterStatus;

    return matchSearch && matchTipo && matchStatus;
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

  const tipoOptions = [
    { value: 'arma', label: '🔫 Armas' },
    { value: 'colete', label: '🛡️ Coletes' },
  ];

  const statusOptions = [
    { value: 'disponivel', label: '📦 Disponível' },
    { value: 'cautelado', label: '🔒 Cautelado' },
    { value: 'manutencao', label: '🔧 Manutenção' },
    { value: 'baixado', label: '❌ Baixado' },
  ];

  const stats = {
    total: items?.length || 0,
    disponiveis: items?.filter(i => i.status === 'disponivel').length || 0,
    cautelados: items?.filter(i => i.status === 'cautelado').length || 0,
    manutencao: items?.filter(i => i.status === 'manutencao').length || 0,
    baixados: items?.filter(i => i.status === 'baixado').length || 0,
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar userName={user.nome} userLevel={user.nivel} onLogout={handleLogout} />

      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Patrimônio</h1>
          <p className="text-gray-600">Controle de armas, coletes e materiais cautelados</p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.disponiveis}</p>
            <p className="text-sm text-green-600">Disponíveis</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.cautelados}</p>
            <p className="text-sm text-blue-600">Cautelados</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.manutencao}</p>
            <p className="text-sm text-yellow-600">Manutenção</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.baixados}</p>
            <p className="text-sm text-red-600">Baixados</p>
          </div>
        </div>

        {/* Filtros e ações */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Buscar por marca, modelo ou patrimônio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os Tipos</option>
            {tipoOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os Status</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {canEdit && (
            <button
              onClick={() => {
                setSelectedItem(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i> Novo Item
            </button>
          )}
        </div>

        {/* Cards de Itens */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems?.map((item) => (
            <PatrimonioCard
              key={item.id}
              item={item}
              onClick={() => setViewingItem(item)}
              onEdit={() => {
                setSelectedItem(item);
                setIsModalOpen(true);
              }}
              onDelete={() => handleDelete(item.id)}
              onCautelar={() => handleCautelar(item)}
              onDevolver={() => handleDevolver(item)}
              onHistorico={() => carregarHistorico(item)}
              canEdit={canEdit}
            />
          ))}
        </div>

        {filteredItems?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <i className="fa-solid fa-box-open text-4xl mb-3 opacity-50"></i>
            <p>Nenhum item encontrado</p>
          </div>
        )}

        {/* Modal de Cadastro/Edição */}
        <PatrimonioForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onSave={async (data) => {
            await saveItem.mutateAsync(data);
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
        />

        {/* Modal de Cautela */}
        {cautelaItem && (
          <CautelaModal
            isOpen={true}
            onClose={() => setCautelaItem(null)}
            itemId={cautelaItem.id}
            itemNome={`${cautelaItem.marca} ${cautelaItem.modelo || ''}`}
            onConfirm={handleConfirmCautela}
          />
        )}

        {/* Modal de Visualização Detalhada */}
        {/* Modal de Visualização Detalhada */}
{viewingItem && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">
            {viewingItem.marca} {viewingItem.modelo || ''}
          </h2>
          <button
            onClick={() => setViewingItem(null)}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveHistoricoTab(false)}
            className={`px-4 py-2 font-medium ${
              !activeHistoricoTab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Informações
          </button>
          <button
            onClick={() => {
              setActiveHistoricoTab(true);
              carregarHistoricoParaModal(viewingItem.id);
            }}
            className={`px-4 py-2 font-medium ${
              activeHistoricoTab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📜 Histórico ({historicoModalList.length})
          </button>
        </div>

        {/* Aba de Informações */}
        {!activeHistoricoTab && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600"><strong>Tipo:</strong></p>
              <p>{viewingItem.tipo === 'arma' ? '🔫 Arma de Fogo' : '🛡️ Colete Balístico'}</p>
            </div>
            <div>
              <p className="text-gray-600"><strong>Status:</strong></p>
              <p className={`font-medium ${
                viewingItem.status === 'disponivel' ? 'text-green-600' :
                viewingItem.status === 'cautelado' ? 'text-blue-600' :
                viewingItem.status === 'manutencao' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {viewingItem.status === 'disponivel' ? '📦 Disponível' :
                 viewingItem.status === 'cautelado' ? '🔒 Cautelado' :
                 viewingItem.status === 'manutencao' ? '🔧 Manutenção' : '❌ Baixado'}
              </p>
            </div>
            <div>
              <p className="text-gray-600"><strong>Nº Patrimônio:</strong></p>
              <p>{viewingItem.numero_patrimonio || 'N/I'}</p>
            </div>
            <div>
              <p className="text-gray-600"><strong>Nº Série:</strong></p>
              <p>{viewingItem.numero_serie || 'N/I'}</p>
            </div>

            {viewingItem.tipo === 'arma' && (
              <>
                <div>
                  <p className="text-gray-600"><strong>Calibre:</strong></p>
                  <p>{viewingItem.calibre || 'N/I'}</p>
                </div>
                <div>
                  <p className="text-gray-600"><strong>CRAF:</strong></p>
                  <p>{viewingItem.craf || 'N/I'}</p>
                </div>
                <div>
                  <p className="text-gray-600"><strong>Carregadores:</strong></p>
                  <p>{viewingItem.capacidade_carregador || 0}</p>
                </div>
              </>
            )}

            {viewingItem.tipo === 'colete' && (
              <>
                <div>
                  <p className="text-gray-600"><strong>Tamanho:</strong></p>
                  <p>{viewingItem.tamanho || 'N/I'}</p>
                </div>
                <div>
                  <p className="text-gray-600"><strong>Sexo:</strong></p>
                  <p>{viewingItem.sexo || 'N/I'}</p>
                </div>
                <div>
                  <p className="text-gray-600"><strong>Validade:</strong></p>
                  <p>{viewingItem.data_validade ? new Date(viewingItem.data_validade).toLocaleDateString('pt-BR') : 'N/I'}</p>
                </div>
              </>
            )}

            {viewingItem.status === 'cautelado' && viewingItem.agente_funcional && (
              <div className="col-span-2">
                <p className="text-gray-600"><strong>Cautelado para:</strong></p>
                <p className="text-blue-600 font-medium">{viewingItem.agente_funcional}</p>
                <p className="text-sm text-gray-500">
                  Data: {viewingItem.data_cautela ? new Date(viewingItem.data_cautela).toLocaleDateString('pt-BR') : 'N/I'}
                </p>
              </div>
            )}

            <div className="col-span-2">
              <p className="text-gray-600"><strong>Observações:</strong></p>
              <p className="text-gray-700">{viewingItem.observacoes || 'Sem observações'}</p>
            </div>

            <div className="col-span-2">
              <p className="text-gray-600"><strong>Cadastrado em:</strong></p>
              <p className="text-sm text-gray-500">
                {viewingItem.criado_em ? new Date(viewingItem.criado_em).toLocaleString('pt-BR') : 'N/I'}
              </p>
            </div>
          </div>
        )}

        {/* Aba de Histórico */}
        {activeHistoricoTab && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {historicoModalList.length === 0 ? (
              <div className="text-center py-12">
                <i className="fa-solid fa-timeline text-4xl text-gray-300 mb-3"></i>
                <p className="text-gray-500">Nenhum registro de histórico encontrado</p>
                <p className="text-xs text-gray-400 mt-2">
                  Ao cautelar ou devolver um item, um registro é criado automaticamente.
                </p>
              </div>
            ) : (
              historicoModalList.map((reg: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {reg.acao === 'cautela' && '🔒 Cautelado'}
                        {reg.acao === 'devolucao' && '🔄 Devolvido'}
                        {reg.acao === 'edicao' && '✏️ Editado'}
                        {reg.acao === 'criacao' && '➕ Criado'}
                        {reg.acao === 'exclusao' && '🗑️ Excluído'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(reg.data_movimentacao).toLocaleString('pt-BR')}
                      </p>
                      {reg.agente_nome && (
                        <p className="text-sm text-blue-600 mt-1">
                          <i className="fa-solid fa-user-shield mr-1"></i>
                          Agente: {reg.agente_nome}
                        </p>
                      )}
                      {reg.usuario_nome && (
                        <p className="text-xs text-gray-500 mt-1">
                          <i className="fa-solid fa-user-check mr-1"></i>
                          Responsável: {reg.usuario_nome}
                        </p>
                      )}
                      {reg.observacoes && (
                        <p className="text-sm text-gray-500 mt-2 italic bg-white p-2 rounded">
                          "{reg.observacoes}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {canEdit && (
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setSelectedItem(viewingItem);
                setViewingItem(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              Editar
            </button>
            <button
              onClick={() => {
                if (confirm('Excluir este item?')) {
                  deleteItem.mutateAsync(viewingItem.id);
                  setViewingItem(null);
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

        {/* Modal de Histórico */}
        {showHistoricoModal && historicoItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">
                    Histórico - {historicoItem.marca} {historicoItem.modelo || ''}
                  </h2>
                  <button
                    onClick={() => setShowHistoricoModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3">
                  {historicoList.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nenhum registro encontrado</p>
                  ) : (
                    historicoList.map((reg: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">
                              {reg.acao === 'cautela' && '🔒 Cautelado'}
                              {reg.acao === 'devolucao' && '🔄 Devolvido'}
                              {reg.acao === 'edicao' && '✏️ Editado'}
                              {reg.acao === 'criacao' && '➕ Criado'}
                              {reg.acao === 'exclusao' && '🗑️ Excluído'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Data: {new Date(reg.data_movimentacao).toLocaleString('pt-BR')}
                            </p>
                            {reg.agente_nome && (
                              <p className="text-sm text-blue-600">
                                <i className="fa-solid fa-user-shield mr-1"></i>
                                {reg.agente_nome}
                              </p>
                            )}
                            {reg.usuario_nome && (
                              <p className="text-xs text-gray-500 mt-1">
                                Responsável: {reg.usuario_nome}
                              </p>
                            )}
                            {reg.observacoes && (
                              <p className="text-sm text-gray-500 mt-2 italic">
                                "{reg.observacoes}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
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