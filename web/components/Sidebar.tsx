'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
  userName: string;
  userLevel: string;
  onLogout: () => void;
}

export default function Sidebar({ userName, userLevel, onLogout }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    { name: 'Dashboard', icon: '📊', path: '/dashboard' },
    { name: 'Equipe', icon: '👥', path: '/agents' },
    { name: 'Patrimônio', icon: '🔫', path: '/patrimonio' },
    { name: 'Viaturas', icon: '🚓', path: '/vehicles' },
    { name: 'Combustível', icon: '⛽', path: '/fuel' },
    { name: 'Autuações', icon: '📝', path: '/infringements' },
    { name: 'Notificações', icon: '🔔', path: '/notifications' },
    { name: 'Documentos', icon: '📄', path: '/documents' },
  ];

  // Adicionar gerenciamento de usuários apenas para gestores
  if (userLevel === 'gestor') {
    navigation.push({ name: 'Usuários', icon: '👤', path: '/users' });
  }

  const getLevelName = () => {
    switch (userLevel) {
      case 'gestor': return 'Gestor';
      case 'administrador': return 'Administrador';
      default: return 'Usuário';
    }
  };

  const handleLogout = () => {
    console.log('[Sidebar] Botão Sair clicado');
    onLogout();
  };

  return (
    <aside
      className={`bg-gray-900 text-white transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo e Toggle */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold">GCM</h1>
              <p className="text-xs text-gray-400">Sistema de Gestão</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-gray-800 transition"
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-lg font-semibold">
              {userName && userName !== 'Carregando...' ? userName.charAt(0).toUpperCase() : '?'}
            </div>
            {!isCollapsed && (
              <div className="flex-1">
                <p className="font-semibold truncate">{userName}</p>
                <p className="text-xs text-gray-400">{getLevelName()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {!isCollapsed && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded transition"
            aria-label="Sair do sistema"
          >
            <span className="text-xl">🚪</span>
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}