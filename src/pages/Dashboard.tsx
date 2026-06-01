import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Campaign, Subscriber } from '../lib/supabase';
import { Users, Megaphone, CheckCircle, TrendingUp, Clock, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ count: total }, { count: active }, { data: camp }] = await Promise.all([
        supabase.from('subscribers').select('*', { count: 'exact', head: true }),
        supabase.from('subscribers').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(5),
      ]);
      setSubscriberCount(total ?? 0);
      setActiveCount(active ?? 0);
      setCampaigns((camp as Campaign[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const done = campaigns.filter(c => c.status === 'done');
  const totalSent = done.reduce((acc, c) => acc + c.sent_count, 0);

  const statCards = [
    {
      label: 'Всего подписчиков',
      value: subscriberCount,
      icon: <Users size={20} />,
      color: 'blue',
    },
    {
      label: 'Активных',
      value: activeCount,
      icon: <TrendingUp size={20} />,
      color: 'green',
    },
    {
      label: 'Рассылок',
      value: campaigns.length,
      icon: <Megaphone size={20} />,
      color: 'orange',
    },
    {
      label: 'Сообщений отправлено',
      value: totalSent,
      icon: <CheckCircle size={20} />,
      color: 'teal',
    },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-900/40 text-blue-400',
    green: 'bg-green-900/40 text-green-400',
    orange: 'bg-orange-900/40 text-orange-400',
    teal: 'bg-teal-900/40 text-teal-400',
  };

  const statusBadge = (s: Campaign['status']) => {
    const map: Record<string, { label: string; cls: string }> = {
      draft: { label: 'Черновик', cls: 'bg-gray-700 text-gray-300' },
      sending: { label: 'Отправка...', cls: 'bg-yellow-900/50 text-yellow-400' },
      done: { label: 'Выполнено', cls: 'bg-green-900/50 text-green-400' },
      failed: { label: 'Ошибка', cls: 'bg-red-900/50 text-red-400' },
    };
    const v = map[s] ?? map.draft;
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.cls}`}>{v.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Дашборд</h1>
        <p className="text-gray-500 text-sm mt-0.5">Общая статистика по рассылкам</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className={`inline-flex p-2.5 rounded-xl mb-3 ${colorMap[card.color]}`}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
            <p className="text-gray-500 text-sm mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent campaigns */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">Последние рассылки</h2>
        </div>
        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Megaphone size={32} className="text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">Рассылок ещё нет</p>
            <a href="#campaigns" className="mt-3 text-blue-400 text-sm hover:underline">
              Создать первую рассылку
            </a>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {campaigns.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{c.message_text}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {c.status === 'done' && (
                    <span className="text-xs text-gray-500">
                      {c.sent_count}/{c.total_count}
                    </span>
                  )}
                  {statusBadge(c.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <a
          href="#campaigns"
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 transition-colors rounded-2xl px-5 py-4"
        >
          <Megaphone size={20} className="text-white" />
          <div>
            <p className="font-semibold text-white text-sm">Новая рассылка</p>
            <p className="text-blue-200 text-xs">Отправить сообщение</p>
          </div>
        </a>
        <a
          href="#subscribers"
          className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 transition-colors rounded-2xl px-5 py-4"
        >
          <Users size={20} className="text-gray-300" />
          <div>
            <p className="font-semibold text-white text-sm">Подписчики</p>
            <p className="text-gray-400 text-xs">Управление базой</p>
          </div>
        </a>
      </div>
    </div>
  );
}
