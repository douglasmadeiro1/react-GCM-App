'use client';

import { useState, useRef } from 'react';
import { supabase } from '../../../shared/services/supabase';
import type { Agent, Certificado } from '../types';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
  onUpdate: () => void;
  canEdit: boolean;
}

const BUCKET_NAME = 'certificados';

export function CertificateModal({ isOpen, onClose, agent, onUpdate, canEdit }: CertificateModalProps) {
  const [loading, setLoading] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificado | null>(null);
  const [formData, setFormData] = useState({ 
    titulo: '', 
    instituicao: '', 
    cargaHoraria: '', 
    dataConclusao: '', 
    dataValidade: '', 
    tipo: '', 
    observacoes: '' 
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const certificados = agent.Certificados || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { 
      alert('❌ Arquivo deve ter no máximo 5MB'); 
      return; 
    }
    const tiposPermitidos = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!tiposPermitidos.includes(file.type)) { 
      alert('❌ Use JPG, PNG ou PDF.'); 
      return; 
    }
    setSelectedFile(file);
    if (file.type !== 'application/pdf') {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const uploadToStorage = async (file: File, certificadoId: string): Promise<string> => {
    const fileName = `${agent.id}/${certificadoId}/${file.name}`;
    const { error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imagemUrl: string | null = editingCert?.imagem || null;
      let imagemTipo: string | null = editingCert?.imagemTipo || null;
      
      if (selectedFile) {
        const tempId = Date.now().toString();
        imagemUrl = await uploadToStorage(selectedFile, tempId);
        imagemTipo = selectedFile.type;
      }
      
      const novoCertificado: Certificado = {
        titulo: formData.titulo,
        instituicao: formData.instituicao,
        cargaHoraria: formData.cargaHoraria ? parseInt(formData.cargaHoraria) : null,
        dataConclusao: formData.dataConclusao,
        dataValidade: formData.dataValidade || null,
        tipo: formData.tipo || null,
        observacoes: formData.observacoes || null,
        imagem: imagemUrl,
        imagemTipo: imagemTipo,
        dataCadastro: new Date().toISOString(),
      };
      
      let novos = [...certificados];
      if (editingCert) {
        const idx = novos.findIndex(c => c.dataCadastro === editingCert.dataCadastro);
        novos[idx] = novoCertificado;
      } else {
        novos.unshift(novoCertificado);
      }
      
      await supabase
        .from('agentes')
        .update({ Certificados: JSON.stringify(novos) })
        .eq('id', agent.id);
      
      resetForm();
      onUpdate();
      alert('✅ Certificado salvo!');
    } catch (error) { 
      console.error(error);
      alert('Erro ao salvar'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (idx: number) => {
    if (!confirm('Excluir certificado?')) return;
    setLoading(true);
    try {
      const novos = [...certificados];
      novos.splice(idx, 1);
      await supabase
        .from('agentes')
        .update({ Certificados: JSON.stringify(novos) })
        .eq('id', agent.id);
      onUpdate();
      alert('✅ Excluído!');
    } catch (error) { 
      alert('Erro ao excluir'); 
    } finally { 
      setLoading(false); 
    }
  };

  const resetForm = () => {
    setFormData({ 
      titulo: '', 
      instituicao: '', 
      cargaHoraria: '', 
      dataConclusao: '', 
      dataValidade: '', 
      tipo: '', 
      observacoes: '' 
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditingCert(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-bold">Certificados</h2>
          <button onClick={onClose} className="text-2xl">×</button>
        </div>
        <p className="text-gray-600 mb-4">{agent.Funcional} - {agent.Graduacao}</p>

        {canEdit && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-3">{editingCert ? 'Editar' : 'Novo Certificado'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="Título *" 
                  value={formData.titulo} 
                  onChange={e => setFormData({...formData, titulo: e.target.value})} 
                  className="px-3 py-2 border rounded-lg" 
                  required 
                />
                <input 
                  type="text" 
                  placeholder="Instituição *" 
                  value={formData.instituicao} 
                  onChange={e => setFormData({...formData, instituicao: e.target.value})} 
                  className="px-3 py-2 border rounded-lg" 
                  required 
                />
                <input 
                  type="number" 
                  placeholder="Carga Horária" 
                  value={formData.cargaHoraria} 
                  onChange={e => setFormData({...formData, cargaHoraria: e.target.value})} 
                  className="px-3 py-2 border rounded-lg" 
                />
                <input 
                  type="date" 
                  placeholder="Data Conclusão" 
                  value={formData.dataConclusao} 
                  onChange={e => setFormData({...formData, dataConclusao: e.target.value})} 
                  className="px-3 py-2 border rounded-lg" 
                  required 
                />
                <input 
                  type="date" 
                  placeholder="Data Validade" 
                  value={formData.dataValidade} 
                  onChange={e => setFormData({...formData, dataValidade: e.target.value})} 
                  className="px-3 py-2 border rounded-lg" 
                />
                <select 
                  value={formData.tipo} 
                  onChange={e => setFormData({...formData, tipo: e.target.value})} 
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Tipo</option>
                  <option>Formação</option>
                  <option>Aperfeiçoamento</option>
                  <option>Especialização</option>
                  <option>Capacitação</option>
                </select>
              </div>
              <textarea 
                placeholder="Observações" 
                value={formData.observacoes} 
                onChange={e => setFormData({...formData, observacoes: e.target.value})} 
                className="w-full px-3 py-2 border rounded-lg" 
                rows={2} 
              />
              <div className="border-2 border-dashed p-4 text-center cursor-pointer hover:border-blue-500">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".jpg,.jpeg,.png,.pdf" 
                  className="hidden" 
                  id="cert-file" 
                />
                <label htmlFor="cert-file" className="cursor-pointer">
                  <i className="fa-solid fa-cloud-arrow-up text-3xl text-gray-400"></i>
                  <p>{selectedFile ? selectedFile.name : 'Clique para selecionar'}</p>
                </label>
              </div>
              {previewUrl && <img src={previewUrl} alt="Preview" className="max-h-32 rounded" />}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Salvar</button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {certificados.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum certificado</p>
          ) : (
            certificados.map((cert, idx) => (
              <div key={idx} className="border rounded-lg p-4 flex gap-4">
                <div 
                  className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center cursor-pointer" 
                  onClick={() => window.open(cert.imagem || '', '_blank')}
                >
                  {cert.imagem ? (
                    cert.imagemTipo === 'application/pdf' ? 
                      <i className="fa-solid fa-file-pdf text-4xl text-red-500"></i> : 
                      <img src={cert.imagem} className="w-full h-full object-cover rounded" />
                  ) : (
                    <i className="fa-solid fa-certificate text-4xl text-gray-400"></i>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{cert.titulo}</h4>
                  <p className="text-sm text-gray-600">{cert.instituicao}</p>
                  <p className="text-sm">
                    Concluído: {new Date(cert.dataConclusao).toLocaleDateString('pt-BR')} 
                    {cert.cargaHoraria && ` • ${cert.cargaHoraria}h`}
                  </p>
                  {cert.observacoes && <p className="text-sm text-gray-500 mt-1">{cert.observacoes}</p>}
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { 
                        setEditingCert(cert); 
                        setFormData({ 
                          titulo: cert.titulo, 
                          instituicao: cert.instituicao, 
                          cargaHoraria: cert.cargaHoraria?.toString() || '', 
                          dataConclusao: cert.dataConclusao, 
                          dataValidade: cert.dataValidade || '', 
                          tipo: cert.tipo || '', 
                          observacoes: cert.observacoes || '' 
                        }); 
                        setSelectedFile(null); 
                      }} 
                      className="text-blue-500"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button onClick={() => handleDelete(idx)} className="text-red-500">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                    {cert.imagem && (
                      <a href={cert.imagem} download className="text-green-500">
                        <i className="fa-solid fa-download"></i>
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}