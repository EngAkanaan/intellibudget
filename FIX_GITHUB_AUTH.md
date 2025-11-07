# 🔐 Fix GitHub Authentication Error

## The Problem
```
remote: Permission to EngAkanaan/intellibudget.git denied to Adam-J-Kanaan.
fatal: unable to access 'https://github.com/EngAkanaan/intellibudget.git/': The requested URL returned error: 403
```

The repository belongs to `EngAkanaan`, but your git credentials are for `Adam-J-Kanaan`.

## ✅ Solution: Use Personal Access Token

### Step 1: Create Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name it: `IntelliBudget Push Token`
4. Select scopes:
   - ✅ **repo** (Full control of private repositories)
5. Click **"Generate token"**
6. **COPY THE TOKEN** (you won't see it again!)

### Step 2: Update Remote URL with Token

```powershell
cd "C:\New Chapter\IntelliBudget\intellibudget-dashboard"

# Replace YOUR_TOKEN with the token you copied
git remote set-url origin https://YOUR_TOKEN@github.com/EngAkanaan/intellibudget.git

# Verify
git remote -v
```

### Step 3: Push

```powershell
git push -f origin main
```

## Alternative: Use GitHub CLI

If you have GitHub CLI installed:

```powershell
gh auth login
git push -f origin main
```

## Alternative: Manual Credential Entry

1. Configure credential helper:
```powershell
git config --global credential.helper wincred
```

2. Try push:
```powershell
git push -f origin main
```

3. When prompted:
   - **Username**: `EngAkanaan`
   - **Password**: Paste your Personal Access Token (not your GitHub password!)

## After Pushing

Once pushed successfully:
1. Go to **Vercel Dashboard → Settings → General**
2. **Clear** the "Root Directory" field
3. **Save** and **Redeploy**

---

**The token method (Step 2) is the most reliable!** 🔑

