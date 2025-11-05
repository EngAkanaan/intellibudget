# IntelliBudget Deployment Guide

## Overview
This guide will help you deploy IntelliBudget as a multi-user web application with authentication and database support.

## 🎯 Recommended Architecture

### Option 1: Supabase (Recommended - Easiest)
**Why Supabase?**
- ✅ Built-in authentication (email, Google, GitHub, etc.)
- ✅ PostgreSQL database (real-time capable)
- ✅ Row-level security for multi-user data
- ✅ Free tier available
- ✅ Easy to set up and integrate

### Option 2: Firebase
**Why Firebase?**
- ✅ Google's platform with authentication
- ✅ Firestore database
- ✅ Free tier available
- ✅ Good for real-time features

### Option 3: Custom Backend
**Technologies:**
- **Backend:** Node.js + Express + PostgreSQL/MongoDB
- **Auth:** JWT tokens + bcrypt
- **Hosting:** Railway, Render, or AWS

## 📋 Deployment Steps

### Phase 1: Quick Static Deployment (No Auth Yet)
**Platform:** Vercel or Netlify (Free)

1. **Build your app:**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel auto-detects Vite and deploys
   - Your site is live at `your-app.vercel.app`

3. **Deploy to Netlify (Alternative):**
   - Go to [netlify.com](https://netlify.com)
   - Drag & drop your `dist` folder
   - Or connect GitHub repo for auto-deploy

**⚠️ Note:** This deploys the app but data is still in localStorage (per browser)

---

### Phase 2: Add Authentication & Database (Supabase)

#### Step 1: Set up Supabase

1. **Create Supabase Account:**
   - Go to [supabase.com](https://supabase.com)
   - Sign up for free
   - Create a new project

2. **Get API Credentials:**
   - Go to Project Settings → API
   - Copy:
     - `Project URL` (e.g., `https://xxxxx.supabase.co`)
     - `anon/public` key
     - `service_role` key (keep secret!)

#### Step 2: Create Database Schema

In Supabase SQL Editor, run:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- YYYY-MM format
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(50),
  amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  payment_method VARCHAR(50),
  recurring_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create monthly_data table
CREATE TABLE monthly_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(7) UNIQUE NOT NULL,
  salary DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Create categories table
CREATE TABLE user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7),
  UNIQUE(user_id, name)
);

-- Create budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  UNIQUE(user_id, month, category)
);

-- Create recurring_expenses table
CREATE TABLE recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create savings_goals table
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  target_date DATE,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create savings_contributions table
CREATE TABLE savings_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES savings_goals(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create payment_methods table
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7),
  UNIQUE(user_id, name)
);

-- Enable Row Level Security (RLS)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Users can only see their own data)
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can manage own monthly_data" ON monthly_data
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own categories" ON user_categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own recurring_expenses" ON recurring_expenses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own savings_goals" ON savings_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own contributions" ON savings_contributions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM savings_goals
      WHERE savings_goals.id = savings_contributions.goal_id
      AND savings_goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own payment_methods" ON payment_methods
  FOR ALL USING (auth.uid() = user_id);
```

#### Step 3: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

#### Step 4: Create Supabase Client File

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### Step 5: Create Environment Variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Add to `.gitignore`:**
```
.env.local
.env
```

#### Step 6: Create Auth Context

Create `src/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### Step 7: Create API Service Layer

Create `src/services/api.ts`:

```typescript
import { supabase } from '../lib/supabase';
import type { Expense, MonthlyData, RecurringExpense, SavingsGoal } from '../types';

// Expenses
export const fetchExpenses = async (month: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('month', month)
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const createExpense = async (expense: Omit<Expense, 'id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      ...expense,
      user_id: user.id,
      month: expense.date.substring(0, 7) // Extract YYYY-MM
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateExpense = async (id: string, updates: Partial<Expense>) => {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteExpense = async (id: string) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Similar functions for monthly_data, budgets, categories, etc.
```

#### Step 8: Update App.tsx

Replace localStorage with API calls:

```typescript
// Instead of localStorage.getItem('intelliBudgetData')
// Use: const data = await fetchMonthlyData();
```

#### Step 9: Create Login/Signup Components

Create `src/components/auth/Login.tsx` and `Signup.tsx`

---

## 🚀 Deployment Checklist

### Before Deploying:
- [ ] Set up Supabase project
- [ ] Create database tables
- [ ] Set up RLS policies
- [ ] Add environment variables
- [ ] Test authentication locally
- [ ] Test data persistence
- [ ] Migrate from localStorage to database

### Deploy to Vercel:
1. Push code to GitHub
2. Connect Vercel to GitHub repo
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Custom Domain (Optional):
- Buy domain (e.g., Namecheap, Google Domains)
- Add domain in Vercel settings
- Update DNS records

---

## 💰 Cost Estimates

### Free Tier (Hobby):
- **Supabase:** 500MB database, 2GB bandwidth/month
- **Vercel:** Unlimited deployments, 100GB bandwidth/month
- **Total:** $0/month

### Paid (If you grow):
- **Supabase Pro:** $25/month (8GB database, 50GB bandwidth)
- **Vercel Pro:** $20/month (Better performance)
- **Total:** ~$45/month

---

## 🔒 Security Considerations

1. **Never expose `service_role` key in frontend**
2. **Use RLS policies** (already in SQL above)
3. **Validate all inputs** on backend
4. **Use HTTPS** (automatic with Vercel)
5. **Rate limiting** (consider adding)

---

## 📝 Next Steps

1. Choose your backend (Supabase recommended)
2. Set up the database schema
3. Install dependencies
4. Create authentication components
5. Migrate localStorage to API calls
6. Test thoroughly
7. Deploy!

---

## 🆘 Need Help?

- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **React + Supabase Tutorial:** https://supabase.com/docs/guides/getting-started/tutorials/with-react

---

**Recommended Order:**
1. Deploy static version first (Vercel) ✅
2. Set up Supabase account
3. Create database schema
4. Add authentication
5. Migrate to database
6. Test & deploy update

