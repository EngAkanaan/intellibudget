# ✅ Connect Vercel to GitHub for Auto-Deploy

## Your Code is Now on GitHub! 🎉

Repository: https://github.com/EngAkanaan/intellibudget.git

## Step 1: Connect Vercel to GitHub

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Open your IntelliBudget project** (or create new if needed)
3. **Go to**: Settings → Git
4. **Click**: "Connect Git Repository"
5. **Select**: GitHub
6. **Authorize Vercel** (if prompted)
7. **Find and select**: `EngAkanaan/intellibudget`
8. **Click**: "Connect"

## Step 2: Verify Settings

After connecting, verify these settings:

- **Framework Preset**: Vite
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Step 3: Verify Environment Variables

Make sure these are set in Vercel (Settings → Environment Variables):

✅ **VITE_SUPABASE_URL**
```
https://pfcpqljhokmrhzmlkqvt.supabase.co
```

✅ **VITE_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmY3BxbGpob2ttcmh6bWxrcXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNzA0NDAsImV4cCI6MjA3Nzk0NjQ0MH0.zyIw7dl4PzSRNKGGoG_WL55r_XA--8NFI9jn6xj7W1w
```

✅ **VITE_PRODUCTION_URL** (your Vercel URL)
```
https://your-vercel-url.vercel.app
```

## Step 4: First Auto-Deploy

After connecting:
- Vercel will automatically detect your push
- It will start a new deployment
- Check the "Deployments" tab to see progress

## Step 5: Test Auto-Deploy

Make a small change and push:

```bash
# Make a small change (e.g., update a comment)
git add .
git commit -m "Test: Auto-deploy from Git"
git push
```

Watch Vercel dashboard - you should see a new deployment starting automatically! 🚀

## ✅ What Happens Now?

Every time you run:
```bash
git add .
git commit -m "Your message"
git push
```

Vercel will:
1. ✅ Detect the push
2. ✅ Build your project
3. ✅ Deploy to production
4. ✅ Update your live site

**No more manual deployments needed!** 🎉

---

## Next Steps:

1. ✅ Code is on GitHub
2. ⏳ Connect Vercel to GitHub (follow steps above)
3. ⏳ Test auto-deploy
4. 🎉 Enjoy automatic deployments!

