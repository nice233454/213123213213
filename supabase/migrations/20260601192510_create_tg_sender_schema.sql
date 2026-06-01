/*
  # TG Sender - Schema Setup

  ## Overview
  Creates all tables needed for a Telegram bot mass-messaging dashboard.

  ## Tables
  1. `bot_settings` - stores the Telegram bot token and webhook URL
  2. `subscribers` - Telegram users who interacted with the bot (/start)
  3. `campaigns` - mass-message campaigns with content, status, stats
  4. `campaign_logs` - per-subscriber delivery records for each campaign

  ## Security
  - RLS enabled on all tables
  - All policies require authenticated access
*/

-- Bot settings
CREATE TABLE IF NOT EXISTS bot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_token text NOT NULL DEFAULT '',
  bot_username text NOT NULL DEFAULT '',
  webhook_url text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read bot settings"
  ON bot_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert bot settings"
  ON bot_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bot settings"
  ON bot_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Subscribers
CREATE TABLE IF NOT EXISTS subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE NOT NULL,
  username text DEFAULT '',
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  is_active boolean DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now()
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read subscribers"
  ON subscribers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert subscribers"
  ON subscribers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update subscribers"
  ON subscribers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete subscribers"
  ON subscribers FOR DELETE
  TO authenticated
  USING (true);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  message_text text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  total_count integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (true);

-- Campaign logs
CREATE TABLE IF NOT EXISTS campaign_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES subscribers(id) ON DELETE CASCADE,
  telegram_id bigint NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text DEFAULT '',
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE campaign_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read campaign logs"
  ON campaign_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert campaign logs"
  ON campaign_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update campaign logs"
  ON campaign_logs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscribers_telegram_id ON subscribers(telegram_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign_id ON campaign_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_is_active ON subscribers(is_active);
