'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../shared/hooks/useAuth';
import { useFuel } from './hooks/useFuel';
import { FuelForm } from './components/FuelForm';
import Sidebar from '../../components/Sidebar';
import type { Abastecimento, AbastecimentoWithStats } from './types';

export default function FuelPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const { 
    abastecimentos, 
    isLoading, 
    saveAbastecimento, 
    updateAbastecimento, 
    deleteAbastecimento,
    calcularEstatisticas,
    getViaturas,
    getAgentes
  } = useFuel();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filterViatura, setFilterViatura] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAbastecimento, setSelectedAbastecimento] = useState<Abastecimento | null>(null);
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [agentes, setAgentes] = useState<any[]>([]);
  const [estatisticas, setEstatisticas] = useState<AbastecimentoWithStats[]>([]);

  const canEdit = user?.nivel === 'gestor';

  useEffect(() => {
    const loadData = async () => {
      const [v, a] = await Promise.all([getViaturas(), getAgentes()]);
      setViaturas(v || []);
      setAgentes(a || []);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (abastecimentos) {
      setEstatisticas(calcularEstatisticas(abastecimentos));
    }
  }, [abastecimentos]);

  // Filtrar
  const filteredAbastecimentos = estatisticas.filter((item) => {
    const matchViatura = !filterViatura || item.viatura_prefixo.toString() === filterViatura;
    const matchDataInicio = !dataInicio || item.data_abastecimento >= dataInicio;
    const matchDataFim = !dataFim || item.data_abastecimento <= dataFim;
    return matchViatura && matchDataInicio && matchDataFim;
  });

  // Totais
  const totais = filteredAbastecimentos.reduce(
    (acc, item) => ({
      litros: acc.litros + item.litros,
      valor: acc.valor + item.valor_total,
      kmRodados: acc.kmRodados + (item.km_rodados || 0),
    }),
    { litros: 0, valor: 0, kmRodados: 0 }
  );

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este abastecimento?')) {
      await deleteAbastecimento.mutateAsync(id);
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
          <h1 className="text-2xl font-bold text-gray-800">Abastecimentos</h1>
          <p className="text-gray-600">Controle de consumo de combustível</p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Viatura</label>
            <select
              value={filterViatura}
              onChange={(e) => setFilterViatura(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {viaturas.map((v) => (
                <option key={v.id} value={v.prefixo}>
                  Viatura {v.prefixo} - {v.placa}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => {
              setFilterViatura('');
              setDataInicio('');
              setDataFim('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Limpar Filtros
          </button>

          {canEdit && (
            <button
              onClick={() => {
                setSelectedAbastecimento(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 ml-auto"
            >
              <i className="fa-solid fa-plus"></i> Novo Abastecimento
            </button>
          )}
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{filteredAbastecimentos.length}</p>
            <p className="text-sm text-gray-500">Abastecimentos</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{totais.litros.toFixed(2)} L</p>
            <p className="text-sm text-gray-500">Total de Litros</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">R$ {totais.valor.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Valor Total</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{totais.kmRodados.toLocaleString()} km</p>
            <p className="text-sm text-gray-500">KM Rodados</p>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Viatura</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Agente</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">KM</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">KM Rodados</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Litros</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Valor</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Consumo</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAbastecimentos.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(item.data_abastecimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {item.viatura_prefixo} {item.viatura_placa && `(${item.viatura_placa})`}
                    </td>
                    <td className="px-4 py-3 text-sm">{item.agente_nome || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right">{item.km_atual.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.km_rodados ? item.km_rodados.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{item.litros.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">R$ {item.valor_total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.consumo_km_l ? `${item.consumo_km_l.toFixed(2)} km/l` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {canEdit && (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedAbastecimento(item);
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
          {filteredAbastecimentos.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <i className="fa-solid fa-gas-pump text-4xl mb-3 opacity-50"></i>
              <p>Nenhum abastecimento encontrado</p>
            </div>
          )}
        </div>

        {/* Modal */}
        <FuelForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAbastecimento(null);
          }}
          abastecimento={selectedAbastecimento}
          viaturas={viaturas}
          agentes={agentes}
          onSave={async (data) => {
            await saveAbastecimento.mutateAsync(data);
            setIsModalOpen(false);
          }}
          onUpdate={async (id, data) => {
            await updateAbastecimento.mutateAsync({ id, data });
            setIsModalOpen(false);
          }}
          ultimoKmPorViatura={(() => {
            const map: Record<number, { km: number; data: string }> = {};
            estatisticas.forEach(item => {
              if (!map[item.viatura_prefixo]) {
                map[item.viatura_prefixo] = { km: item.km_atual, data: item.data_abastecimento };
              }
            });
            return map;
          })()}
        />
      </main>
    </div>
  );
}