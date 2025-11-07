-- ============================================
-- CLEAR ALL DATA FROM DATABASE
-- WARNING: This will DELETE ALL DATA from all tables!
-- Table structures will remain intact.
-- ============================================
-- Run this in Supabase SQL Editor to clear all data
-- ============================================

-- IMPORTANT: Read all instructions before running!
-- This script will delete ALL data from:
--   - expenses
--   - monthly_data
--   - user_categories
--   - budgets
--   - recurring_expenses
--   - recurring_templates
--   - savings_goals
--   - savings_contributions
--   - payment_methods
--   - income_sources

-- Tables are cleared in order to respect foreign key constraints
-- Your table structures will remain intact, only data is deleted

-- ============================================
-- STEP 1: Clear data from tables with foreign keys first
-- ============================================

-- Clear savings_contributions (depends on savings_goals)
TRUNCATE TABLE savings_contributions CASCADE;

-- Clear savings_goals
TRUNCATE TABLE savings_goals CASCADE;

-- Clear recurring_expenses (may have dependencies)
TRUNCATE TABLE recurring_expenses CASCADE;

-- Clear recurring_templates
TRUNCATE TABLE recurring_templates CASCADE;

-- Clear expenses (may have dependencies)
TRUNCATE TABLE expenses CASCADE;

-- Clear income_sources
TRUNCATE TABLE income_sources CASCADE;

-- Clear budgets
TRUNCATE TABLE budgets CASCADE;

-- Clear monthly_data
TRUNCATE TABLE monthly_data CASCADE;

-- Clear user_categories
TRUNCATE TABLE user_categories CASCADE;

-- Clear payment_methods
TRUNCATE TABLE payment_methods CASCADE;

-- ============================================
-- VERIFICATION: Check that all tables are empty
-- ============================================
-- Run these queries after to verify:

-- SELECT COUNT(*) FROM expenses;
-- SELECT COUNT(*) FROM monthly_data;
-- SELECT COUNT(*) FROM user_categories;
-- SELECT COUNT(*) FROM budgets;
-- SELECT COUNT(*) FROM recurring_expenses;
-- SELECT COUNT(*) FROM recurring_templates;
-- SELECT COUNT(*) FROM savings_goals;
-- SELECT COUNT(*) FROM savings_contributions;
-- SELECT COUNT(*) FROM payment_methods;
-- SELECT COUNT(*) FROM income_sources;

-- All should return 0

-- ============================================
-- DONE! Your database is now empty.
-- Table structures remain intact and ready for new data.
-- ============================================

