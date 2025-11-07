-- ============================================
-- COMPLETE DATABASE RESET
-- WARNING: This will DELETE ALL DATA AND RECREATE TABLES!
-- Use this if you want a completely fresh start.
-- ============================================
-- Run this in Supabase SQL Editor for a complete reset
-- ============================================

-- IMPORTANT: This script will:
--   1. Drop all existing tables (this deletes ALL data)
--   2. Recreate all tables with their structures
--   3. Recreate all indexes
--   4. Recreate all RLS policies

-- If you only want to clear data but keep tables, use CLEAR_ALL_DATA.sql instead

-- ============================================
-- STEP 1: Disable RLS and Drop All Tables
-- ============================================

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS savings_contributions CASCADE;
DROP TABLE IF EXISTS savings_goals CASCADE;
DROP TABLE IF EXISTS recurring_expenses CASCADE;
DROP TABLE IF EXISTS recurring_templates CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS income_sources CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS monthly_data CASCADE;
DROP TABLE IF EXISTS user_categories CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;

-- ============================================
-- STEP 2: Recreate All Tables
-- ============================================

-- EXPENSES TABLE
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month VARCHAR(7) NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  payment_method VARCHAR(50),
  recurring_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MONTHLY DATA TABLE
CREATE TABLE monthly_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month VARCHAR(7) NOT NULL,
  salary DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- USER CATEGORIES TABLE
CREATE TABLE user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- BUDGETS TABLE
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month VARCHAR(7) NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month, category)
);

-- RECURRING EXPENSES TABLE
CREATE TABLE recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  payment_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RECURRING EXPENSE TEMPLATES TABLE
CREATE TABLE recurring_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  frequency VARCHAR(20) NOT NULL,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SAVINGS GOALS TABLE
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  target_date DATE,
  category VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SAVINGS CONTRIBUTIONS TABLE
CREATE TABLE savings_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES savings_goals(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PAYMENT METHODS TABLE
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- INCOME SOURCES TABLE
CREATE TABLE income_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  source_type VARCHAR(50) NOT NULL DEFAULT 'other',
  notes TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_day_of_month INTEGER,
  recurring_start_date VARCHAR(7),
  recurring_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT valid_month_format CHECK (month ~ '^\d{4}-\d{2}$'),
  CONSTRAINT valid_day_of_month CHECK (recurring_day_of_month IS NULL OR (recurring_day_of_month >= 1 AND recurring_day_of_month <= 31))
);

-- ============================================
-- STEP 3: Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_expenses_user_month ON expenses(user_id, month);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_monthly_data_user_month ON monthly_data(user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_income_sources_user_month ON income_sources(user_id, month);
CREATE INDEX IF NOT EXISTS idx_income_sources_date ON income_sources(date);
CREATE INDEX IF NOT EXISTS idx_income_sources_recurring ON income_sources(is_recurring, recurring_day_of_month);

-- ============================================
-- STEP 4: Enable Row Level Security
-- ============================================

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Create RLS Policies
-- ============================================

-- EXPENSES POLICIES
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'Users can view own expenses') THEN
    DROP POLICY "Users can view own expenses" ON expenses;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'Users can insert own expenses') THEN
    DROP POLICY "Users can insert own expenses" ON expenses;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'Users can update own expenses') THEN
    DROP POLICY "Users can update own expenses" ON expenses;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'Users can delete own expenses') THEN
    DROP POLICY "Users can delete own expenses" ON expenses;
  END IF;
END $$;

CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- MONTHLY DATA POLICIES
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'monthly_data' AND policyname = 'Users can manage own monthly_data') THEN
    DROP POLICY "Users can manage own monthly_data" ON monthly_data;
  END IF;
END $$;
CREATE POLICY "Users can manage own monthly_data" ON monthly_data FOR ALL USING (auth.uid() = user_id);

-- CATEGORIES POLICIES
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_categories' AND policyname = 'Users can manage own categories') THEN
    DROP POLICY "Users can manage own categories" ON user_categories;
  END IF;
END $$;
CREATE POLICY "Users can manage own categories" ON user_categories FOR ALL USING (auth.uid() = user_id);

-- BUDGETS POLICIES
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'budgets' AND policyname = 'Users can manage own budgets') THEN
    DROP POLICY "Users can manage own budgets" ON budgets;
  END IF;
END $$;
CREATE POLICY "Users can manage own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);

-- RECURRING EXPENSES POLICIES
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'recurring_expenses' AND policyname = 'Users can manage own recurring_expenses') THEN
    DROP POLICY "Users can manage own recurring_expenses" ON recurring_expenses;
  END IF;
END $$;
CREATE POLICY "Users can manage own recurring_expenses" ON recurring_expenses FOR ALL USING (auth.uid() = user_id);

-- RECURRING TEMPLATES POLICIES
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'recurring_templates' AND policyname = 'Users can manage own recurring_templates') THEN
    DROP POLICY "Users can manage own recurring_templates" ON recurring_templates;
  END IF;
END $$;
CREATE POLICY "Users can manage own recurring_templates" ON recurring_templates FOR ALL USING (auth.uid() = user_id);

-- SAVINGS GOALS POLICIES
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'savings_goals' AND policyname = 'Users can manage own savings_goals') THEN
    DROP POLICY "Users can manage own savings_goals" ON savings_goals;
  END IF;
END $$;
CREATE POLICY "Users can manage own savings_goals" ON savings_goals FOR ALL USING (auth.uid() = user_id);

-- SAVINGS CONTRIBUTIONS POLICIES
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'savings_contributions' AND policyname = 'Users can manage own contributions') THEN
    DROP POLICY "Users can manage own contributions" ON savings_contributions;
  END IF;
END $$;
CREATE POLICY "Users can manage own contributions" ON savings_contributions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM savings_goals
    WHERE savings_goals.id = savings_contributions.goal_id
    AND savings_goals.user_id = auth.uid()
  )
);

-- PAYMENT METHODS POLICIES
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_methods' AND policyname = 'Users can manage own payment_methods') THEN
    DROP POLICY "Users can manage own payment_methods" ON payment_methods;
  END IF;
END $$;
CREATE POLICY "Users can manage own payment_methods" ON payment_methods FOR ALL USING (auth.uid() = user_id);

-- INCOME SOURCES POLICIES
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

CREATE POLICY "Users can view own income sources" ON income_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income sources" ON income_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income sources" ON income_sources FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own income sources" ON income_sources FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- DONE! Database has been completely reset.
-- All tables recreated with fresh structure.
-- ============================================

