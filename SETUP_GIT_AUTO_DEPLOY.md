# 🚀 Setup Git Auto-Deploy to Vercel

This guide will help you set up automatic deployments so that every time you push code to Git, Vercel automatically deploys your updates!

## Step 1: Initialize Git Repository (If Not Already Done)

### Check if Git is already initialized:
```bash
git status
```

If you see "fatal: not a git repository", then initialize it:

```bash
git init
```

## Step 2: Create/Update .gitignore

Make sure your `.gitignore` file includes these important entries:

```gitignore
# Environment variables (NEVER commit these!)
.env
.env.local
.env.*.local

# Dependencies
node_modules/
/.pnp
.pnp.js

# Build output
dist/
dist-ssr/
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Vercel
.vercel

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*
```

## Step 3: Create GitHub Repository

### Option A: Create New Repository on GitHub

1. Go to https://github.com/new
2. **Repository name**: `intellibudget-dashboard` (or any name you like)
3. **Description**: "Personal Budget Management Dashboard"
4. **Visibility**: Choose Public or Private
5. **DO NOT** check "Initialize with README" (we already have files)
6. Click **"Create repository"**

### Option B: Use Existing Repository

If you already have a GitHub repository, just note the URL (e.g., `https://github.com/yourusername/intellibudget-dashboard`)

## Step 4: Add Files and Make First Commit

```bash
# Add all files (except those in .gitignore)
git add .

# Make your first commit
git commit -m "Initial commit: IntelliBudget Dashboard with Supabase integration"

# Add your GitHub repository as remote
# Replace YOUR_USERNAME and REPO_NAME with your actual values
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Or if using SSH:
# git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 5: Connect Vercel to GitHub

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click **"Add New Project"** (or go to your existing project)
3. Click **"Import Git Repository"**
4. Select **GitHub** and authorize Vercel
5. Find your `intellibudget-dashboard` repository
6. Click **"Import"**

### Method 2: Update Existing Project

If you already have a Vercel project:

1. Go to your project on Vercel dashboard
2. Go to **Settings** → **Git**
3. Click **"Connect Git Repository"**
4. Select your GitHub repository
5. Click **"Connect"**

## Step 6: Configure Vercel Project Settings

After connecting Git, configure these settings:

1. **Framework Preset**: Vite
2. **Root Directory**: `./`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

## Step 7: Add Environment Variables in Vercel

**CRITICAL!** Make sure these are set:

1. Go to **Settings** → **Environment Variables**
2. Add these variables (select all environments):

   **VITE_SUPABASE_URL**
   ```
   https://pfcpqljhokmrhzmlkqvt.supabase.co
   ```

   **VITE_SUPABASE_ANON_KEY**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmY3BxbGpob2ttcmh6bWxrcXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNzA0NDAsImV4cCI6MjA3Nzk0NjQ0MH0.zyIw7dl4PzSRNKGGoG_WL55r_XA--8NFI9jn6xj7W1w
   ```

   **VITE_PRODUCTION_URL** (your Vercel URL)
   ```
   https://your-project.vercel.app
   ```

## Step 8: First Auto-Deploy

After connecting Git, Vercel will automatically:
1. ✅ Detect your push to GitHub
2. ✅ Start a new deployment
3. ✅ Build your project
4. ✅ Deploy to production

You'll see this in your Vercel dashboard!

## Step 9: Update Supabase CORS

Make sure Supabase allows your Vercel domain:

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/pfcpqljhokmrhzmlkqvt
2. Go to **Settings** → **API**
3. Under **"CORS"**, add:
   - `https://your-project.vercel.app`
   - `https://*.vercel.app` (for preview deployments)
4. Click **Save**

## Step 10: Workflow Going Forward

Now, every time you make changes:

```bash
# 1. Make your code changes
# ... edit files ...

# 2. Stage changes
git add .

# 3. Commit with a descriptive message
git commit -m "Fix: Improved logout button design"

# 4. Push to GitHub
git push

# 5. Vercel automatically deploys! 🎉
# Check Vercel dashboard to see the deployment progress
```

## Step 11: Test Auto-Deploy

1. Make a small change (e.g., update a comment)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test: Auto-deploy from Git"
   git push
   ```
3. Go to Vercel dashboard
4. You should see a new deployment starting automatically!

## Troubleshooting

### Issue: "Repository not found"
- **Solution**: Make sure you've authorized Vercel to access your GitHub account
- **Solution**: Check that the repository name is correct

### Issue: Build fails on Vercel
- **Solution**: Check build logs in Vercel dashboard
- **Solution**: Make sure `npm run build` works locally first
- **Solution**: Verify all environment variables are set

### Issue: Environment variables not working
- **Solution**: Make sure they're set for all environments (Production, Preview, Development)
- **Solution**: Redeploy after adding environment variables

### Issue: Changes not deploying
- **Solution**: Make sure you pushed to the `main` branch (or the branch Vercel is watching)
- **Solution**: Check Vercel project settings → Git → Production Branch

## Best Practices

1. **Always commit with descriptive messages**:
   ```bash
   git commit -m "Feature: Add dark mode toggle"
   git commit -m "Fix: Resolve email verification redirect issue"
   git commit -m "Update: Improve sidebar design"
   ```

2. **Never commit `.env.local`**:
   - It's already in `.gitignore`
   - Always add environment variables in Vercel dashboard

3. **Test locally before pushing**:
   ```bash
   npm run build  # Make sure it builds successfully
   npm run dev    # Test locally
   ```

4. **Use branches for big features** (optional):
   ```bash
   git checkout -b feature/new-feature
   # ... make changes ...
   git push origin feature/new-feature
   # Vercel will create a preview deployment!
   ```

## What Happens Now?

✅ **Every `git push`** → Vercel automatically:
- Detects the change
- Builds your project
- Deploys to production
- Updates your live site

✅ **No more manual deployments needed!**

✅ **Team members can also push** → Same automatic deployment!

---

**🎉 You're all set! Now every code change you push will automatically deploy to Vercel!**

