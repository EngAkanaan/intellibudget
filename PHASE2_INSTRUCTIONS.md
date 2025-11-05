# Phase 2 Setup Instructions - Authentication & Database

## ✅ What's Been Created

1. ✅ Supabase client library installed
2. ✅ Database schema SQL file (`database/schema.sql`)
3. ✅ Supabase client configuration (`lib/supabase.ts`)
4. ✅ Authentication context (`contexts/AuthContext.tsx`)
5. ✅ Login/Signup component (`components/Auth.tsx`)
6. ✅ Supabase API service layer (`services/supabaseApi.ts`)

## 📋 Step-by-Step Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Sign Up" (free account)
3. Create a new project:
   - **Name:** `intellibudget` (or your choice)
   - **Database Password:** Create a strong password (SAVE IT!)
   - **Region:** Choose closest to you
   - Click "Create new project"
   - ⏳ Wait 2-3 minutes for setup

### Step 2: Get API Credentials

1. In your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### Step 3: Create Environment File

Create a file named `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Replace** `your-project-id` and `your-anon-key-here` with your actual values from Step 2.

### Step 4: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open the file `database/schema.sql` from this project
4. Copy ALL the SQL code
5. Paste it into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. ✅ You should see "Success. No rows returned"

This creates all the tables and security policies!

### Step 5: Test the Setup

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open your browser** to `http://localhost:3000`

3. **You should see:**
   - Login/Signup page
   - Try creating an account
   - Try signing in

4. **If you see errors:**
   - Check that `.env.local` has correct values
   - Check browser console for errors
   - Verify database schema was run successfully

### Step 6: Update App.tsx (Next Step)

We still need to update `App.tsx` to use Supabase instead of localStorage. This will be done next.

---

## 🔧 Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in the project root
- Make sure variable names start with `VITE_`
- Restart your dev server after creating `.env.local`

### "User not authenticated"
- Make sure you've signed up/logged in
- Check browser console for auth errors

### Database errors
- Make sure you ran the SQL schema in Supabase
- Check that RLS policies were created
- Verify your user_id is being set correctly

---

## 📝 Next Steps

After completing Steps 1-5, we'll:
1. Update `App.tsx` to use Supabase API
2. Add loading states
3. Handle data migration from localStorage
4. Test everything
5. Deploy to Vercel with environment variables

---

## 🆘 Need Help?

If you get stuck:
1. Check the browser console for errors
2. Check Supabase dashboard → Logs for database errors
3. Verify all environment variables are set correctly

