-- Push Subscriptions Table
-- Stores Web Push API subscription objects so the server can send background
-- push notifications (e.g. monthly summary, budget alerts) even when the app
-- is closed.
--
-- Required when you add backend-triggered push:
--   1. Generate VAPID keys:  npx web-push generate-vapid-keys
--   2. Add VITE_VAPID_PUBLIC_KEY to .env.local (frontend)
--   3. Add VAPID_PRIVATE_KEY to Supabase secrets (edge functions)
--   4. Run this migration in the Supabase SQL editor.

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- One subscription per endpoint per user
  unique (user_id, endpoint)
);

-- Enable Row-Level Security
alter table public.push_subscriptions enable row level security;

-- Users can only manage their own subscriptions
create policy "Users manage own push subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role (edge functions) can read all subscriptions to send push
create policy "Service role can read all push subscriptions"
  on public.push_subscriptions
  for select
  using (auth.role() = 'service_role');

-- Index for fast lookup by user
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);
