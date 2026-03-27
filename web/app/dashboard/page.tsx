'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [, setHasError] = useState(false);

  // 1. Defina TODOS os hooks no topo do componente
  const carregarNotificacoes = useCallback(async () => {
    if (!user) return; // Segurança extra

    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .in('status', ['pendente', 'vencida'])
        .limit(10);

      if (error) throw error;

      setNotifications(data?.map((n: any) => ({
        id: n.id,
        message: `Notificação ${n.numero_notificacao} - ${n.natureza}`,
        link: '/notifications',
        type: 'postura',
      })) || []);
      setHasError(false);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      setHasError(true);
    }
  }, [user]);

  // 2. Redirecionamento
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // 3. Log controlado (apenas se houver usuário)
  useEffect(() => {
    if (user) {
      console.log('[Dashboard] Usuário Ativo:', user.nome);
    }
  }, [user]);

  // 4. Chamada de dados
  useEffect(() => {
    if (user) {
      carregarNotificacoes();
    }
  }, [user, carregarNotificacoes]);

  const handleLogout = async () => {
    await logout();
  };

  // 5. AGORA sim, as proteções de renderização (após todos os hooks)
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Carregando autenticação...
      </div>
    );
  }

  if (!user) {
    return null; // Evita flash de conteúdo antes do redirecionamento
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        userName={user.nome}
        userLevel={user.nivel}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {/* Renderize suas notificações aqui usando o estado 'notifications' */}
      </main>
    </div>
  );
}