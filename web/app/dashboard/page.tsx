'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '../../shared/services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasError, setHasError] = useState(false);

  // ✅ REDIRECIONAMENTO CORRETO
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // ✅ LOG CONTROLADO
  useEffect(() => {
    if (!user) return;

    console.log('[Dashboard] Estado:', {
      authLoading,
      userNome: user?.nome,
      timestamp: new Date().toISOString(),
    });
  }, [authLoading, user]);

  const carregarNotificacoes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .in('status', ['pendente', 'vencida'])
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        setNotifications(
          data.map((n: any) => ({
            id: n.id,
            message: `Notificação ${n.numero_notificacao} - ${n.natureza}`,
            link: '/notifications',
            type: 'postura',
          }))
        );
      } else {
        setNotifications([]);
      }

      setHasError(false);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      setHasError(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      carregarNotificacoes();
    }
  }, [user, carregarNotificacoes]);

  const handleLogout = async () => {
    await logout();
  };

  // ✅ BLOQUEIA RENDER COMPLETAMENTE
  if (authLoading || !user) {
    return null;
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
      </main>
    </div>
  );
}