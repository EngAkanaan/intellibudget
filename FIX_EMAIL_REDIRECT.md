# 🔧 Fix Email Verification Link Issue

## The Problem
When you sign up from localhost, the email verification link points to `http://localhost:5173`, which doesn't work on your phone.

## The Solution
We need to set the production URL so email links always point to your live Vercel site, even when testing locally.

## Step 1: Add Production URL to `.env.local`

Add this line to your `.env.local` file:

```env
VITE_PRODUCTION_URL=https://your-vercel-url.vercel.app
```

**Replace `your-vercel-url.vercel.app` with your actual Vercel URL!**

For example, if your Vercel URL is `https://intellibudget.vercel.app`, add:
```env
VITE_PRODUCTION_URL=https://intellibudget.vercel.app
```

## Step 2: Add Production URL to Vercel Environment Variables

1. Go to your Vercel dashboard
2. Click your IntelliBudget project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name**: `VITE_PRODUCTION_URL`
   - **Value**: `https://your-vercel-url.vercel.app` (your actual Vercel URL)
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save**

## Step 3: Update Supabase Email Redirect URL

The code now automatically uses the production URL for email links, but you should also update Supabase settings:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/pfcpqljhokmrhzmlkqvt
2. Go to **Settings** → **Authentication** → **URL Configuration**
3. In **"Site URL"**, add your Vercel URL: `https://your-vercel-url.vercel.app`
4. In **"Redirect URLs"**, add: `https://your-vercel-url.vercel.app/**`
5. Click **Save**

## Step 4: Restart Dev Server

After updating `.env.local`:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 5: Test

1. Sign up with a new account from your localhost
2. Check the email - the verification link should now point to your Vercel URL
3. Click the link on your phone - it should work!

## How It Works Now

- **In Development (localhost)**: Email links point to your production Vercel URL
- **In Production (Vercel)**: Email links point to the same Vercel URL
- **Result**: Email verification works on phones! ✅

---

**Note**: Make sure to replace `your-vercel-url.vercel.app` with your actual Vercel URL!

