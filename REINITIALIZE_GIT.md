# 🔧 Fix: Reinitialize Git in Project Directory

## The Problem
Your Git repository root is at `C:/New Chapter`, but your project is in `IntelliBudget/intellibudget-dashboard/`. This causes Vercel to not find the files.

## ✅ Solution: Reinitialize Git in Project Directory

This will make the repository root match the project root, so Vercel won't need a `rootDirectory` setting.

### Step 1: Navigate to Project Directory
```powershell
cd "C:\New Chapter\IntelliBudget\intellibudget-dashboard"
```

### Step 2: Initialize New Git Repository
```powershell
git init
```

### Step 3: Add Remote Repository
```powershell
git remote add origin https://github.com/EngAkanaan/intellibudget.git
```

If you get "remote origin already exists", remove it first:
```powershell
git remote remove origin
git remote add origin https://github.com/EngAkanaan/intellibudget.git
```

### Step 4: Add All Files
```powershell
git add .
```

### Step 5: Commit
```powershell
git commit -m "Reinitialize git in project directory"
```

### Step 6: Force Push (This Rewrites History!)
```powershell
git push -f origin main
```

**⚠️ Warning**: `git push -f` will overwrite the remote repository. Make sure:
- You have a backup
- You're okay with rewriting history
- No one else is working on this repository

### Step 7: Update vercel.json
After reinitializing, update `vercel.json` to remove rootDirectory:

```json
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

### Step 8: Clear Root Directory in Vercel
1. Go to **Vercel Dashboard → Your Project → Settings → General**
2. Find **"Root Directory"** field
3. **Clear it** (leave it empty)
4. Save and Redeploy

---

## After This
- Repository root = Project root ✅
- Vercel can find `package.json` at root ✅
- No need for `rootDirectory` setting ✅

