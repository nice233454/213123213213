import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Campaign } from '../lib/supabase';
import {
  Megaphone, Plus, Send, Trash2, RefreshCw, ChevronRight,
  CheckCircle, AlertCircle, Clock, FileText, X, Eye
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);

  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [parseMode, setParseMode] = useState<'HTML' | 'Markdown' | ''>('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    setCampaigns((data as Campaign[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!name.trim() || !text.trim()) return;
    const { data } = await supabase.from('campaigns').insert({
      name: name.trim(),
      message_text: text.trim(),
      status: 'draft',
    }).select().maybeSingle();
    if (data) {
      setCampaigns(prev => [data as Campaign, ...prev]);
      setName('');
      setText('');
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('campaigns').delete().eq('id', id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const handleSend = async (campaign: Campaign) => {
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-campaign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaign_id: campaign.id }),
      });
      const json = await res.json();
      setSendResult({ sent: json.sent ?? 0, failed: json.failed ?? 0 });
      load();
    } catch {
      setSendResult({ sent: 0, failed: -1 });
    }
    setSending(false);
  };

  const statusBadge = (s: Campaign['status']) => {
    const map = {
      draft: { label: 'Черновик', cls: 'bg-gray-700 text-gray-300', icon: <FileText size={12} /> },
      sending: { label: 'Отправка', cls: 'bg-yellow-900/50 text-yellow-400', icon: <Clock size={12} /> },
      done: { label: 'Выполнено', cls: 'bg-green-900/50 text-green-400', icon: <CheckCircle size={12} /> },
      failed: { label: 'Ошибка', cls: 'bg-red-900/50 text-red-400', icon: <AlertCircle size={12} /> },
    };
    const v = map[s] ?? map.draft;
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${v.cls}`}>
        {v.icon} {v.label}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Рассылки</h1>
          <p className="text-gray-500 text-sm mt-0.5">Создавайте и запускайте кампании</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl transition-colors"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={15} />
            Новая рассылка
          </button>
        </div>
      </div>

      {/* Campaign list */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Megaphone size={32} className="text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">Рассылок ещё нет</p>
            <button
              onClick={() => setCreating(true)}
              className="mt-3 text-blue-400 text-sm hover:underline"
            >
              Создать первую
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {campaigns.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-white truncate">{c.name}</p>
                    {statusBadge(c.status)}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.message_text}</p>
                  {c.status === 'done' && (
                    <p className="text-xs text-gray-600 mt-1">
                      Отправлено: {c.sent_count} · Ошибок: {c.failed_count}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelected(c)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
                    title="Просмотр"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                  {c.status === 'draft' && (
                    <button
                      onClick={() => setSelected(c)}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Send size={13} />
                      Запустить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white">Новая рассылка</h3>
              <button onClick={() => setCreating(false)} className="p-1.5 text-gray-500 hover:text-white rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Название кампании</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Например: Акция июнь 2026"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Текст сообщения</label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={6}
                  placeholder="Введите текст рассылки..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                />
                <p className="text-xs text-gray-600 mt-1">{text.length} символов</p>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Форматирование</label>
                <div className="flex gap-2">
                  {['', 'HTML', 'Markdown'].map(m => (
                    <button
                      key={m}
                      onClick={() => setParseMode(m as any)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        parseMode === m
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {m || 'Нет'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setCreating(false)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-xl transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || !text.trim()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white">{selected.name}</h3>
              <button onClick={() => { setSelected(null); setSendResult(null); }} className="p-1.5 text-gray-500 hover:text-white rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 mb-5">
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{selected.message_text}</p>
            </div>

            {sendResult ? (
              <div className={`rounded-xl p-4 mb-5 ${sendResult.failed === -1 ? 'bg-red-900/30 border border-red-800' : 'bg-green-900/30 border border-green-800'}`}>
                {sendResult.failed === -1 ? (
                  <p className="text-red-400 text-sm">Ошибка при отправке. Проверьте настройки бота.</p>
                ) : (
                  <div>
                    <p className="text-green-400 font-medium">Рассылка завершена</p>
                    <p className="text-green-300 text-sm mt-1">
                      Отправлено: {sendResult.sent} · Ошибок: {sendResult.failed}
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {selected.status === 'draft' && !sendResult && (
              <button
                onClick={() => handleSend(selected)}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Запустить рассылку
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
