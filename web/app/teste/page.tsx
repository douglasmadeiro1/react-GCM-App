'use client';

import { supabase, formatDate } from '@gcm/shared';
import { useEffect, useState } from 'react';

export default function TestePage() {
  const [status, setStatus] = useState('Verificando...');

  useEffect(() => {
    async function checkSupabase() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setStatus(`✅ Supabase conectado! Sessão: ${data.session ? 'Ativa' : 'Inativa'}`);
      } catch (err: any) {
        setStatus(`❌ Erro: ${err.message}`);
      }
    }
    checkSupabase();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste do Shared Package</h1>
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Data formatada:</strong> {formatDate('2024-01-15')}</p>
        <p><strong>Supabase URL:</strong> Configurada via variável de ambiente</p>
      </div>
    </div>
  );
}