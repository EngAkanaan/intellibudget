-- Income Sources Table
-- This table stores multiple income sources per month
CREATE TABLE IF NOT EXISTS income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- YYYY-MM format
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL, -- YYYY-MM-DD
  source_type VARCHAR(50) NOT NULL DEFAULT 'other', -- salary, business, crypto, loan, investment, other
  notes TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_day_of_month INTEGER, -- 1-31, for recurring income
  recurring_start_date VARCHAR(7), -- YYYY-MM, when recurring income starts
  recurring_id UUID, -- Reference to recurring income template if applicable
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT valid_month_format CHECK (month ~ '^\d{4}-\d{2}$'),
  CONSTRAINT valid_day_of_month CHECK (recurring_day_of_month IS NULL OR (recurring_day_of_month >= 1 AND recurring_day_of_month <= 31))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_income_sources_user_month ON income_sources(user_id, month);
CREATE INDEX IF NOT EXISTS idx_income_sources_date ON income_sources(date);
CREATE INDEX IF NOT EXISTS idx_income_sources_recurring ON income_sources(is_recurring, recurring_day_of_month);

-- Row Level Security (RLS)
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to re-run)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'income_sources' AND policyname = 'Users can view own income sources') THEN
    DROP POLICY "Users can view own income sources" ON income_sources;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'income_sources' AND policyname = 'Users can insert own income sources') THEN
    DROP POLICY "Users can insert own income sources" ON income_sources;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'income_sources' AND policyname = 'Users can update own income sources') THEN
    DROP POLICY "Users can update own income sources" ON income_sources;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'income_sources' AND policyname = 'Users can delete own income sources') THEN
    DROP POLICY "Users can delete own income sources" ON income_sources;
  END IF;
END $$;

-- Policy: Users can only see their own income sources
CREATE POLICY "Users can view own income sources"
  ON income_sources FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own income sources
CREATE POLICY "Users can insert own income sources"
  ON income_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own income sources
CREATE POLICY "Users can update own income sources"
  ON income_sources FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own income sources
CREATE POLICY "Users can delete own income sources"
  ON income_sources FOR DELETE
  USING (auth.uid() = user_id);

