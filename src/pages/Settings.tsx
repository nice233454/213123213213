import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { BotSettings } from '../lib/supabase';
import { Settings as SettingsIcon, Save, CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function Settings() {
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [registering, setRegistering] = useState(false);
  const [regResult, setRegResult] = useState<{ ok: boolean; message: string } | null>(null);

  const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-webhook`;

  useEffect(() => {
    supabase.from('bot_settings').select('*').maybeSingle().then(({ data }) => {
      if (data) {
        setSettings(data as BotSettings);
        setToken((data as BotSettings).bot_token ?? '');
        setUsername((data as BotSettings).bot_username ?? '');
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      bot_token: token.trim(),
      bot_username: username.trim(),
      webhook_url: webhookUrl,
    };
    if (settings?.id) {
      await supabase.from('bot_settings').update(payload).eq('id', settings.id);
    } else {
      const { data } = await supabase.from('bot_settings').insert(payload).select().maybeSingle();
      if (data) setSettings(data as BotSettings);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTestBot = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`https://api.telegram.org/bot${token.trim()}/getMe`);
      const json = await res.json();
      if (json.ok) {
        setTestResult({ ok: true, message: `Бот найден: @${json.result.username}` });
        setUsername(json.result.username);
      } else {
        setTestResult({ ok: false, message: json.description ?? 'Ошибка API' });
      }
    } catch {
      setTestResult({ ok: false, message: 'Ошибка соединения' });
    }
    setTesting(false);
  };

  const handleRegisterWebhook = async () => {
    setRegistering(true);
    setRegResult(null);
    try {
      const res = await fetch(`https://api.telegram.org/bot${token.trim()}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const json = await res.json();
      if (json.ok) {
        setRegResult({ ok: true, message: 'Webhook успешно зарегистрирован' });
      } else {
        setRegResult({ ok: false, message: json.description ?? 'Ошибка' });
      }
    } catch {
      setRegResult({ ok: false, message: 'Ошибка соединения' });
    }
    setRegistering(false);
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Настройки</h1>
        <p className="text-gray-500 text-sm mt-0.5">Конфигурация Telegram бота</p>
      </div>

      {/* Bot token */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon size={16} className="text-blue-400" />
          <h2 className="font-semibold text-white">Токен бота</h2>
        </div>
        <p className="text-gray-500 text-sm -mt-2">
          Получите токен у{' '}
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:underline"
          >
            @BotFather
          </a>
        </p>

        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Bot Token</label>
          <input
            type="text"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        {testResult && (
          <div className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl ${
            testResult.ok ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'
          }`}>
            {testResult.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {testResult.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleTestBot}
            disabled={!token.trim() || testing}
            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-sm rounded-xl transition-colors"
          >
            {testing ? 'Проверка...' : 'Проверить токен'}
          </button>
          <button
            onClick={handleSave}
            disabled={!token.trim() || saving}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            {saved ? (
              <><CheckCircle size={15} /> Сохранено</>
            ) : (
              <><Save size={15} /> {saving ? 'Сохранение...' : 'Сохранить'}</>
            )}
          </button>
        </div>
      </div>

      {/* Webhook */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-white">Webhook</h2>
        <p className="text-gray-500 text-sm -mt-2">
          Telegram будет отправлять обновления на этот URL. Зарегистрируйте его после сохранения токена.
        </p>

        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Webhook URL</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-400 font-mono truncate">
              {webhookUrl}
            </div>
            <button
              onClick={() => copyToClipboard(webhookUrl)}
              className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-colors"
              title="Копировать"
            >
              <Copy size={15} />
            </button>
          </div>
        </div>

        {regResult && (
          <div className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl ${
            regResult.ok ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'
          }`}>
            {regResult.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {regResult.message}
          </div>
        )}

        <button
          onClick={handleRegisterWebhook}
          disabled={!token.trim() || registering}
          className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-sm py-2.5 rounded-xl transition-colors"
        >
          <ExternalLink size={15} />
          {registering ? 'Регистрация...' : 'Зарегистрировать Webhook'}
        </button>
      </div>

      {/* Guide */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-3">Инструкция</h2>
        <ol className="space-y-2 text-sm text-gray-400">
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
            Создайте бота через <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">@BotFather</a> и скопируйте токен
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
            Вставьте токен выше, проверьте и сохраните
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
            Зарегистрируйте Webhook — бот начнёт собирать подписчиков
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
            Когда пользователи напишут боту /start, они попадут в базу подписчиков
          </li>
          <li className="flex gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">5</span>
            В разделе "Рассылки" создайте кампанию и запустите отправку
          </li>
        </ol>
      </div>
    </div>
  );
}
