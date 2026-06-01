import { NavLink } from './NavLink';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Megaphone, Settings, Send, LogOut
} from 'lucide-react';

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
  const { signOut, session } = useAuth();

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Send size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">TG Sender</p>
            <p className="text-gray-500 text-xs">Рассылки в Telegram</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLink to="dashboard" icon={<LayoutDashboard size={18} />} label="Дашборд" />
          <NavLink to="subscribers" icon={<Users size={18} />} label="Подписчики" />
          <NavLink to="campaigns" icon={<Megaphone size={18} />} label="Рассылки" />
          <NavLink to="settings" icon={<Settings size={18} />} label="Настройки" />
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-800">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-gray-500 truncate">{session?.user.email}</p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-gray-950">
        {children}
      </main>
    </div>
  );
}
