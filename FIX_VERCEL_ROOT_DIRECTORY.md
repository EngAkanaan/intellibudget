# 🔧 Fix: Vercel Root Directory Issue

## The Problem
Your Git repository root is at `C:/New Chapter`, but your project is in `IntelliBudget/intellibudget-dashboard/`. Vercel can't find the root directory.

## ✅ Solution Options

### Option 1: Set Root Directory in Vercel Dashboard (Recommended)
1. Go to **Vercel Dashboard → Your Project → Settings → General**
2. Find **"Root Directory"** field
3. Try these paths (one at a time):
   - `IntelliBudget/intellibudget-dashboard` (no leading slash)
   - `./IntelliBudget/intellibudget-dashboard` (with ./ prefix)
   - `IntelliBudget/intellibudget-dashboard/` (with trailing slash)
4. Save and redeploy

### Option 2: Reinitialize Git in Correct Directory (Best Long-term)
Move the `.git` folder to the project directory so the repo root matches the project root:

```powershell
# 1. Navigate to project
cd "C:\New Chapter\IntelliBudget\intellibudget-dashboard"

# 2. Copy current .git folder
Copy-Item "C:\New Chapter\.git" -Destination ".git" -Recurse

# 3. Update remote URL if needed
git remote set-url origin https://github.com/EngAkanaan/intellibudget.git

# 4. Remove old .git from parent
Remove-Item "C:\New Chapter\.git" -Recurse -Force

# 5. Push changes
git push -f origin main
```

**⚠️ Warning**: This will change your repository structure. Make sure to backup first!

### Option 3: Use Vercel CLI to Deploy
Instead of connecting to GitHub, deploy directly from your local machine:

```powershell
cd "C:\New Chapter\IntelliBudget\intellibudget-dashboard"
npx vercel --prod
```

This will deploy from the current directory, ignoring the nested structure.

---

## Current Status
I've updated `vercel.json` to use `./IntelliBudget/intellibudget-dashboard`. Try setting this in Vercel Dashboard first.

If it still doesn't work, we should consider **Option 2** (reinitializing git in the correct directory).

