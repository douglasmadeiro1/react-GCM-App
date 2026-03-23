'use client';

import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import type { Notification } from '../types';  // ← corrigido: importando do caminho correto

interface NotificationBellProps {
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationBell({ onNotificationClick }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { getPendingNotifications, markAllAsCompleted, updateStatus } = useNotifications();

  useEffect(() => {
    loadPending();
    const interval = setInterval(loadPending, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPending = async () => {
    const list = await getPendingNotifications();
    setPending(list);
    setCount(list.length);
  };

  const handleMarkAll = async () => {
    await markAllAsCompleted.mutateAsync();
    await loadPending();
    setIsOpen(false);
  };

  const handleMarkAsCompleted = async (id: string) => {
    await updateStatus.mutateAsync({ id, status: 'cumprida' });
    await loadPending();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return '⏳';
      case 'vencida': return '⚠️';
      default: return '✅';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pendente': return 'text-yellow-600';
      case 'vencida': return 'text-red-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition"
      >
        <i className="fa-solid fa-bell text-xl"></i>
        {count > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold">Notificações</h3>
            {count > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Marcar todas como cumpridas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {pending.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <i className="fa-solid fa-check-circle text-2xl mb-2"></i>
                <p className="text-sm">Nenhuma notificação pendente</p>
              </div>
            ) : (
              pending.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    if (onNotificationClick) onNotificationClick(notif);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {notif.numero_notificacao}
                      </p>
                      <p className="text-xs text-gray-500">
                        {notif.notificado} - {notif.natureza}
                      </p>
                      <p className="text-xs text-gray-400">
                        Data: {new Date(notif.data_notificacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${getStatusClass(notif.status)}`}>
                        {getStatusIcon(notif.status)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsCompleted(notif.id);
                        }}
                        className="text-xs text-green-600 hover:text-green-800"
                        title="Marcar como cumprida"
                      >
                        <i className="fa-solid fa-check"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}