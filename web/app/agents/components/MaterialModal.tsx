'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/services/supabase';
import type { Agent } from '../types';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
  onUpdate: () => void;
  canEdit: boolean;
}

export function MaterialModal({ isOpen, onClose, agent, onUpdate, canEdit }: MaterialModalProps) {
  const [activeTab, setActiveTab] = useState<'armas' | 'coletes' | 'municao' | 'historico'>('armas');
  const [loading, setLoading] = useState(false);
  const [itensDisponiveis, setItensDisponiveis] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'arma' | 'colete'>('arma');

  const armas = agent.Armas || [];
  const coletes = agent.Coletes || [];
  const municao = agent.Municao || [];
  const historicoArmas = agent["Historico Armas"] || [];
  const historicoColetes = agent["Historico Coletes"] || [];
  const historicoMunicao = agent["Historico Municao"] || [];

  const buscarItensDisponiveis = async (tipo: 'arma' | 'colete') => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patrimonio')
        .select('*')
        .eq('tipo', tipo)
        .eq('status', 'disponivel');
      
      if (error) throw error;
      setItensDisponiveis(data || []);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    } finally {
      setLoading(false);
    }
  };

  const cautelarItem = async (item: any, tipo: 'arma' | 'colete') => {
    if (!confirm(`Cautelar ${item.marca} ${item.modelo || ''} para ${agent.Funcional}?`)) return;
    
    setLoading(true);
    try {
      // 1. Atualizar patrimônio
      const { error: updateError } = await supabase
        .from('patrimonio')
        .update({
          status: 'cautelado',
          agente_id: agent.id,
          data_cautela: new Date().toISOString().split('T')[0],
        })
        .eq('id', item.id);
      
      if (updateError) throw updateError;
      
      // 2. Adicionar ao agente
      const novoItem = {
        patrimonio_id: item.id,
        marca: item.marca,
        modelo: item.modelo,
        numero_patrimonio: item.numero_patrimonio,
        numero_serie: item.numero_serie,
        dataCautela: new Date().toISOString().split('T')[0],
        ...(tipo === 'arma' && {
          calibre: item.calibre,
          craf: item.craf,
          carregador: item.capacidade_carregador || 0,
        }),
        ...(tipo === 'colete' && {
          tamanho: item.tamanho,
          sexo: item.sexo,
          validade: item.data_validade,
        }),
      };
      
      const campoArray = tipo === 'arma' ? 'Armas' : 'Coletes';
      const arrayAtual = agent[campoArray as keyof Agent] as any[] || [];
      const novoArray = [novoItem, ...arrayAtual];
      
      const { error: updateAgentError } = await supabase
        .from('agentes')
        .update({ [campoArray]: JSON.stringify(novoArray) })
        .eq('id', agent.id);
      
      if (updateAgentError) throw updateAgentError;
      
      // Disparar eventos para sincronização
      window.dispatchEvent(new CustomEvent('agente-updated', {
        detail: { acao: 'cautela', agenteId: agent.id, itemId: item.id }
      }));
      window.dispatchEvent(new CustomEvent('patrimonio-updated', {
        detail: { acao: 'cautela', agenteId: agent.id, itemId: item.id }
      }));
      
      alert('✅ Item cautelado com sucesso!');
      onUpdate();
      setShowAddModal(false);
      onClose();
    } catch (error) {
      console.error('Erro ao cautelar:', error);
      alert('Erro ao cautelar item');
    } finally {
      setLoading(false);
    }
  };

  const devolverItem = async (item: any, tipo: 'arma' | 'colete' | 'municao', index: number) => {
    if (!confirm(`Devolver ${item.marca} ${item.modelo || ''} ao estoque?`)) return;
    
    setLoading(true);
    try {
      if (tipo !== 'municao' && item.patrimonio_id) {
        await supabase
          .from('patrimonio')
          .update({ status: 'disponivel', agente_id: null, data_cautela: null })
          .eq('id', item.patrimonio_id);
      }
      
      const campoArray = tipo === 'arma' ? 'Armas' : tipo === 'colete' ? 'Coletes' : 'Municao';
      const campoHistorico = tipo === 'arma' ? 'Historico Armas' : tipo === 'colete' ? 'Historico Coletes' : 'Historico Municao';
      
      const arrayAtual = [...(agent[campoArray as keyof Agent] as any[] || [])];
      const historicoAtual = [...(agent[campoHistorico as keyof Agent] as any[] || [])];
      
      const itemDevolvido = { ...item, dataDevolucao: new Date().toISOString().split('T')[0], baixado: false };
      arrayAtual.splice(index, 1);
      historicoAtual.unshift(itemDevolvido);
      
      await supabase
        .from('agentes')
        .update({
          [campoArray]: JSON.stringify(arrayAtual),
          [campoHistorico]: JSON.stringify(historicoAtual),
        })
        .eq('id', agent.id);
      
      // Disparar eventos para sincronização
      window.dispatchEvent(new CustomEvent('agente-updated', {
        detail: { acao: 'devolucao', agenteId: agent.id, itemId: item.patrimonio_id }
      }));
      window.dispatchEvent(new CustomEvent('patrimonio-updated', {
        detail: { acao: 'devolucao', agenteId: agent.id, itemId: item.patrimonio_id }
      }));
      
      alert('✅ Item devolvido com sucesso!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Erro ao devolver:', error);
      alert('Erro ao devolver item');
    } finally {
      setLoading(false);
    }
  };

  const restaurarItem = async (item: any, tipo: 'arma' | 'colete' | 'municao', index: number) => {
    if (!confirm(`Restaurar ${item.marca} ${item.modelo || ''} para a cautela do agente?`)) return;
    
    setLoading(true);
    try {
      const campoAtual = tipo === 'arma' ? 'Armas' : tipo === 'colete' ? 'Coletes' : 'Municao';
      const campoHistorico = tipo === 'arma' ? 'Historico Armas' : tipo === 'colete' ? 'Historico Coletes' : 'Historico Municao';
      
      const atuais = [...(agent[campoAtual as keyof Agent] as any[] || [])];
      const historico = [...(agent[campoHistorico as keyof Agent] as any[] || [])];
      
      const [itemRestaurado] = historico.splice(index, 1);
      delete itemRestaurado.dataDevolucao;
      itemRestaurado.baixado = false;
      atuais.unshift(itemRestaurado);
      
      if (tipo !== 'municao' && itemRestaurado.patrimonio_id) {
        await supabase
          .from('patrimonio')
          .update({ status: 'cautelado', agente_id: agent.id })
          .eq('id', itemRestaurado.patrimonio_id);
      }
      
      await supabase
        .from('agentes')
        .update({
          [campoAtual]: JSON.stringify(atuais),
          [campoHistorico]: JSON.stringify(historico),
        })
        .eq('id', agent.id);
      
      // Disparar eventos para sincronização
      window.dispatchEvent(new CustomEvent('agente-updated', {
        detail: { acao: 'restauracao', agenteId: agent.id, itemId: itemRestaurado.patrimonio_id }
      }));
      window.dispatchEvent(new CustomEvent('patrimonio-updated', {
        detail: { acao: 'restauracao', agenteId: agent.id, itemId: itemRestaurado.patrimonio_id }
      }));
      
      alert('✅ Item restaurado com sucesso!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Erro ao restaurar:', error);
      alert('Erro ao restaurar item');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Material Bélico</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
          <p className="text-gray-600 mb-4">{agent.Funcional} - {agent.Graduacao}</p>

          <div className="flex border-b mb-4">
            {['armas', 'coletes', 'municao', 'historico'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 font-medium ${
                  activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                }`}
              >
                {tab === 'armas' && `🔫 Armas (${armas.length})`}
                {tab === 'coletes' && `🛡️ Coletes (${coletes.length})`}
                {tab === 'municao' && `🎯 Munição (${municao.length})`}
                {tab === 'historico' && `📜 Histórico`}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {activeTab === 'armas' && (
              <div>
                {canEdit && (
                  <button
                    onClick={() => { setAddType('arma'); buscarItensDisponiveis('arma'); setShowAddModal(true); }}
                    className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >+ Adicionar Arma</button>
                )}
                {armas.length === 0 ? <p className="text-gray-500 text-center py-8">Nenhuma arma cautelada</p> :
                  armas.map((arma, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg border-l-4 border-orange-500 mb-2">
                      <div className="flex justify-between">
                        <div><h4 className="font-semibold">{arma.marca} {arma.modelo}</h4>
                        <p className="text-sm">Patrimônio: {arma.numero_patrimonio || 'N/I'} | Calibre: {arma.calibre || 'N/I'}</p>
                        <p className="text-sm">Cautela: {new Date(arma.dataCautela).toLocaleDateString('pt-BR')}</p></div>
                        {canEdit && <div className="flex gap-2">
                          <button onClick={() => devolverItem(arma, 'arma', idx)} className="text-orange-500 hover:text-orange-700" title="Devolver"><i className="fa-solid fa-rotate-left"></i></button>
                          <button className="text-red-500 hover:text-red-700" title="Excluir"><i className="fa-solid fa-trash"></i></button>
                        </div>}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === 'coletes' && (
              <div>
                {canEdit && (
                  <button
                    onClick={() => { setAddType('colete'); buscarItensDisponiveis('colete'); setShowAddModal(true); }}
                    className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >+ Adicionar Colete</button>
                )}
                {coletes.length === 0 ? <p className="text-gray-500 text-center py-8">Nenhum colete cautelado</p> :
                  coletes.map((colete, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-500 mb-2">
                      <div className="flex justify-between">
                        <div><h4 className="font-semibold">{colete.marca} {colete.modelo}</h4>
                        <p className="text-sm">Patrimônio: {colete.numero_patrimonio || 'N/I'} | Tamanho: {colete.tamanho || 'N/I'}</p>
                        <p className="text-sm">Cautela: {new Date(colete.dataCautela).toLocaleDateString('pt-BR')}</p></div>
                        {canEdit && <div className="flex gap-2">
                          <button onClick={() => devolverItem(colete, 'colete', idx)} className="text-orange-500 hover:text-orange-700" title="Devolver"><i className="fa-solid fa-rotate-left"></i></button>
                        </div>}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === 'municao' && (
              <div>
                {canEdit && <button className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">+ Adicionar Munição</button>}
                {municao.length === 0 ? <p className="text-gray-500 text-center py-8">Nenhuma munição cautelada</p> :
                  municao.map((m, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg border-l-4 border-yellow-500 mb-2">
                      <div className="flex justify-between">
                        <div><h4 className="font-semibold">{m.marca} {m.modelo}</h4>
                        <p className="text-sm">Calibre: {m.calibre} | Quantidade: {m.quantidade}</p>
                        <p className="text-sm">Cautela: {new Date(m.dataCautela).toLocaleDateString('pt-BR')}</p></div>
                        {canEdit && <div className="flex gap-2">
                          <button onClick={() => devolverItem(m, 'municao', idx)} className="text-orange-500 hover:text-orange-700" title="Devolver"><i className="fa-solid fa-rotate-left"></i></button>
                        </div>}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === 'historico' && (
              <div>
                <h3 className="font-semibold">Armas Devolvidas</h3>
                {historicoArmas.length === 0 ? <p className="text-gray-500 text-sm">Nenhuma arma no histórico</p> :
                  historicoArmas.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded border-l-4 border-gray-400 mb-2">
                      <p><b>{item.marca} {item.modelo}</b></p>
                      <p className="text-sm">Devolvido: {new Date(item.dataDevolucao).toLocaleDateString('pt-BR')}</p>
                      {canEdit && <button onClick={() => restaurarItem(item, 'arma', idx)} className="mt-1 text-sm text-green-600">↺ Restaurar</button>}
                    </div>
                  ))}
                
                <h3 className="font-semibold mt-4">Coletes Devolvidos</h3>
                {historicoColetes.length === 0 ? <p className="text-gray-500 text-sm">Nenhum colete no histórico</p> :
                  historicoColetes.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded border-l-4 border-gray-400 mb-2">
                      <p><b>{item.marca} {item.modelo}</b></p>
                      <p className="text-sm">Devolvido: {new Date(item.dataDevolucao).toLocaleDateString('pt-BR')}</p>
                      {canEdit && <button onClick={() => restaurarItem(item, 'colete', idx)} className="mt-1 text-sm text-green-600">↺ Restaurar</button>}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Selecionar {addType === 'arma' ? 'Arma' : 'Colete'}</h3>
            {loading ? <p>Carregando...</p> : itensDisponiveis.length === 0 ? <p className="text-gray-500">Nenhum item disponível.</p> :
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {itensDisponiveis.map((item) => (
                  <div key={item.id} onClick={() => cautelarItem(item, addType)} className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <p className="font-medium">{item.marca} {item.modelo || ''}</p>
                    <p className="text-sm text-gray-500">Patrimônio: {item.numero_patrimonio || 'N/I'}</p>
                  </div>
                ))}
              </div>
            }
            <div className="mt-4 flex justify-end"><button onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg">Cancelar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}