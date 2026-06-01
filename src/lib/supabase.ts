import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Subscriber = {
  id: string;
  telegram_id: number;
  username: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  joined_at: string;
  last_seen: string;
};

export type Campaign = {
  id: string;
  name: string;
  message_text: string;
  status: 'draft' | 'sending' | 'done' | 'failed';
  total_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  sent_at: string | null;
};

export type BotSettings = {
  id: string;
  bot_token: string;
  bot_username: string;
  webhook_url: string;
};

export type CampaignLog = {
  id: string;
  campaign_id: string;
  subscriber_id: string;
  telegram_id: number;
  status: 'pending' | 'sent' | 'failed';
  error_message: string;
  sent_at: string;
};
