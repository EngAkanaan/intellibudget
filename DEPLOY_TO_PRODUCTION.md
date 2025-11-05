# 🚀 Deploy IntelliBudget to Production (Vercel)

## Step 1: Make Sure Everything is Ready

✅ **Checklist:**
- [ ] All code changes are saved
- [ ] `.env.local` file has your Supabase credentials
- [ ] You've tested the app locally and it works
- [ ] You have a Vercel account (free account works!)

## Step 2: Build the Project

Run this command to make sure the build works:

```bash
npm run build
```

If you see any errors, fix them before deploying.

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Website (Easiest)

1. **Go to Vercel**: https://vercel.com
2. **Sign in** (or create a free account if you don't have one)
3. **Click "Add New Project"**
4. **Import your Git repository**:
   - If your code is on GitHub/GitLab/Bitbucket, connect it
   - Or drag and drop your project folder
5. **Configure the project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (if deploying from root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Option B: Deploy via Vercel CLI (Command Line)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project? **No** (first time) or **Yes** (updates)
   - What's your project's name? **intellibudget** (or any name)
   - In which directory is your code located? **./**
   - Override settings? **No**

4. **For production deployment**:
   ```bash
   vercel --prod
   ```

## Step 4: Add Environment Variables

**CRITICAL STEP!** You must add your Supabase credentials to Vercel:

1. Go to your project on Vercel dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add these two variables:

   **Variable 1:**
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://pfcpqljhokmrhzmlkqvt.supabase.co`
   - **Environment**: Production, Preview, Development (select all)

   **Variable 2:**
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmY3BxbGpob2ttcmh6bWxrcXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNzA0NDAsImV4cCI6MjA3Nzk0NjQ0MH0.zyIw7dl4PzSRNKGGoG_WL55r_XA--8NFI9jn6xj7W1w`
   - **Environment**: Production, Preview, Development (select all)

4. Click **"Save"**

## Step 5: Update Supabase CORS Settings

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/pfcpqljhokmrhzmlkqvt
2. Click **"Settings"** → **"API"**
3. Scroll down to **"CORS"** section
4. Add your Vercel URL to the allowed origins:
   - Your Vercel URL will look like: `https://your-project-name.vercel.app`
   - Or: `https://your-custom-domain.com`
   - Add: `https://*.vercel.app` (allows all Vercel previews)
   - Click **"Save"**

## Step 6: Redeploy

After adding environment variables, you need to redeploy:

1. Go to your Vercel project dashboard
2. Click **"Deployments"** tab
3. Click the **"..."** menu on the latest deployment
4. Click **"Redeploy"**

Or use CLI:
```bash
vercel --prod
```

## Step 7: Test Your Live Site

1. Visit your Vercel URL (you'll see it in the Vercel dashboard)
2. Try signing up with a new account
3. Check if everything works:
   - ✅ Sign up works
   - ✅ Email verification works
   - ✅ Login works
   - ✅ Data syncs across devices
   - ✅ All features work

## Step 8: (Optional) Add Custom Domain

1. Go to Vercel project → **"Settings"** → **"Domains"**
2. Add your custom domain (e.g., `intellibudget.com`)
3. Follow Vercel's instructions to configure DNS
4. Update Supabase CORS with your custom domain

## Troubleshooting

### Issue: "Failed to fetch" errors
- **Solution**: Make sure environment variables are set in Vercel
- **Solution**: Check Supabase CORS settings include your Vercel URL

### Issue: Blank page
- **Solution**: Check browser console (F12) for errors
- **Solution**: Verify build succeeded without errors

### Issue: Authentication not working
- **Solution**: Check that Supabase URL and Key are correct in Vercel environment variables
- **Solution**: Make sure Supabase project is active

### Issue: Data not syncing
- **Solution**: Check browser console for API errors
- **Solution**: Verify database schema is deployed in Supabase

## What Happens Next?

Once deployed:
- ✅ Your site is live and accessible to everyone!
- ✅ Users can sign up and use the app
- ✅ Data syncs across all devices
- ✅ Works on mobile phones, tablets, and computers
- ✅ Free SSL certificate (HTTPS) automatically included

## Need Help?

- Check Vercel logs: Dashboard → Deployments → Click deployment → "Logs"
- Check Supabase logs: Dashboard → Logs
- Check browser console: F12 → Console tab

---

**🎉 Congratulations! Your app is now live and ready for users!**

