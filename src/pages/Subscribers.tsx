import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Subscriber } from '../lib/supabase';
import {
  Users, Search, Trash2, UserCheck, UserX, Plus, Upload, RefreshCw
} from 'lucide-react';

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('subscribers')
      .select('*')
      .order('joined_at', { ascending: false });
    setSubscribers((data as Subscriber[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = subscribers.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(s.telegram_id).includes(q) ||
      (s.username ?? '').toLowerCase().includes(q) ||
      (s.first_name ?? '').toLowerCase().includes(q)
    );
  });

  const toggleActive = async (s: Subscriber) => {
    await supabase.from('subscribers').update({ is_active: !s.is_active }).eq('id', s.id);
    setSubscribers(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x));
  };

  const deleteSubscriber = async (id: string) => {
    await supabase.from('subscribers').delete().eq('id', id);
    setSubscribers(prev => prev.filter(x => x.id !== id));
  };

  const handleBulkImport = async () => {
    const ids = bulkText
      .split(/[\n,\s]+/)
      .map(s => s.trim())
      .filter(s => /^\d+$/.test(s))
      .map(s => parseInt(s, 10));

    if (!ids.length) return;
    setImporting(true);

    const rows = ids.map(tid => ({
      telegram_id: tid,
      username: '',
      first_name: String(tid),
      last_name: '',
      is_active: true,
    }));

    await supabase.from('subscribers').upsert(rows, { onConflict: 'telegram_id' });
    setBulkOpen(false);
    setBulkText('');
    setImporting(false);
    load();
  };

  const activeCount = subscribers.filter(s => s.is_active).length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Подписчики</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {subscribers.length} всего · {activeCount} активных
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setBulkOpen(true)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-xl transition-colors"
          >
            <Upload size={15} />
            Импорт
          </button>
          <button
            onClick={load}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm px-3 py-2 rounded-xl transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по ID, юзернейму, имени..."
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users size={32} className="text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">
              {search ? 'Ничего не найдено' : 'Подписчики ещё не добавлены'}
            </p>
            {!search && (
              <button
                onClick={() => setBulkOpen(true)}
                className="mt-3 text-blue-400 text-sm hover:underline"
              >
                Импортировать Telegram ID
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Пользователь</th>
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Telegram ID</th>
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Добавлен</th>
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Статус</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-900/40 flex items-center justify-center text-blue-400 text-xs font-bold">
                        {(s.first_name?.[0] || s.username?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">
                          {s.first_name || s.username || 'Без имени'}
                          {s.last_name ? ` ${s.last_name}` : ''}
                        </p>
                        {s.username && (
                          <p className="text-xs text-gray-500">@{s.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-sm text-gray-400">{s.telegram_id}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-500">
                      {new Date(s.joined_at).toLocaleDateString('ru-RU')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {s.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        Активен
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                        Отключён
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => toggleActive(s)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
                        title={s.is_active ? 'Отключить' : 'Включить'}
                      >
                        {s.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>
                      <button
                        onClick={() => deleteSubscriber(s.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bulk import modal */}
      {bulkOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6">
            <h3 className="font-bold text-white mb-1">Импорт Telegram ID</h3>
            <p className="text-gray-500 text-sm mb-4">
              Введите Telegram ID (числа) — каждый с новой строки или через запятую
            </p>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              rows={8}
              placeholder={'123456789\n987654321\n...'}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none font-mono"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setBulkOpen(false); setBulkText(''); }}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleBulkImport}
                disabled={importing || !bulkText.trim()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {importing ? 'Импорт...' : 'Импортировать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
