# 🚀 Quick Git Push Fix

## The Problem
You're authenticated as `Adam-J-Kanaan` but trying to push to `EngAkanaan/intellibudget.git` - this causes permission denied.

## Solution: Use Your Own Account

### Step 1: Create Repository on GitHub (if not exists)

1. Go to: https://github.com/new
2. **Repository name**: `intellibudget`
3. **Visibility**: Public or Private
4. **DO NOT** check "Initialize with README"
5. Click **"Create repository"**

### Step 2: Update Remote URL

The remote is already set to your account. Just push:

```bash
git push -u origin main
```

### Step 3: If Authentication Fails

GitHub no longer accepts passwords. You need a **Personal Access Token**:

1. **Create Token**:
   - Go to: https://github.com/settings/tokens
   - Click **"Generate new token"** → **"Generate new token (classic)"**
   - **Note**: "IntelliBudget Push"
   - **Expiration**: 90 days (or No expiration)
   - **Scopes**: Check `repo` (all repo permissions)
   - Click **"Generate token"**
   - **COPY THE TOKEN** (you won't see it again!)

2. **Use Token to Push**:
   ```bash
   # When Git asks for username: Enter your GitHub username (Adam-J-Kanaan)
   # When Git asks for password: Paste the token (not your password!)
   git push -u origin main
   ```

### Alternative: Use Token in URL (One-time)

```bash
# Replace YOUR_TOKEN with the token you just created
git remote set-url origin https://YOUR_TOKEN@github.com/Adam-J-Kanaan/intellibudget.git
git push -u origin main
```

### Step 4: After Successful Push

1. Go to Vercel Dashboard
2. Connect your GitHub repository
3. Auto-deploy is ready! 🎉

## Quick Commands:

```bash
# Check remote
git remote -v

# Should show: https://github.com/Adam-J-Kanaan/intellibudget.git

# Push (will prompt for username and token)
git push -u origin main
```

---

**Note**: After first push, you can set up SSH for easier future pushes (no tokens needed).

