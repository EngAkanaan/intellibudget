# Quick Deployment Steps - Phase 1

## Option 1: Deploy with Vercel CLI (Recommended - Fastest)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```
This will open your browser to authenticate.

### Step 3: Deploy
```bash
vercel
```
Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Select your account)
- Link to existing project? **No**
- Project name? **intellibudget-dashboard** (or your choice)
- Directory? **./** (current directory)
- Override settings? **No**

### Step 4: Production Deploy (Optional)
```bash
vercel --prod
```

**Done!** Your site will be live at: `https://your-project-name.vercel.app`

---

## Option 2: Deploy via GitHub + Vercel Dashboard

### Step 1: Create New GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it: `intellibudget-dashboard`
4. Make it **Public** (or Private if you have GitHub Pro)
5. **Don't** initialize with README
6. Click "Create repository"

### Step 2: Push to GitHub

```bash
# Create new remote (remove old one if needed)
git remote remove origin
git remote add origin https://github.com/YOUR-USERNAME/intellibudget-dashboard.git

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Push
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import your `intellibudget-dashboard` repository
5. Vercel auto-detects settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Click "Deploy"
7. Wait 1-2 minutes
8. **Done!** Your site is live!

---

## After Deployment

✅ Your site will be live at: `https://your-project.vercel.app`

✅ Every time you push to GitHub, Vercel auto-deploys (if using Option 2)

✅ You can share this link with anyone!

⚠️ **Note:** Data is still stored in localStorage (per browser), so each user's data is separate but only on their device.

---

## Next Steps (Phase 2)

Once Phase 1 is working, we'll add:
- User authentication
- Cloud database
- Multi-user support

