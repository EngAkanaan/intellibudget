-- Agent notes (Quick Notes + AI Budget Agent history)
-- Run in Supabase SQL Editor after main schema is applied.

CREATE TABLE IF NOT EXISTS agent_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  processed BOOLEAN DEFAULT FALSE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  agent_result JSONB,
  agent_status VARCHAR(20) DEFAULT 'raw' NOT NULL,
  CONSTRAINT agent_notes_status_check CHECK (
    agent_status IN ('raw', 'parsed', 'needs_info', 'applied', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS idx_agent_notes_user_created
  ON agent_notes(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_notes_user_unprocessed
  ON agent_notes(user_id, processed)
  WHERE processed = FALSE;

ALTER TABLE agent_notes ENABLE ROW LEVEL SECURITY;

-- Idempotent policy setup (safe to re-run)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agent_notes'
      AND policyname = 'Users can manage own agent_notes'
  ) THEN
    DROP POLICY "Users can manage own agent_notes" ON agent_notes;
  END IF;
END $$;

CREATE POLICY "Users can manage own agent_notes" ON agent_notes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
