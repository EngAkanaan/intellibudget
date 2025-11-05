# 🔧 Fix Git Push Issues

## Issue: Permission Denied

You're trying to push to `EngAkanaan/intellibudget.git` but you're authenticated as `Adam-J-Kanaan`.

## Solution Options:

### Option 1: Use Your Own Account (Recommended)

If you want to use `Adam-J-Kanaan` account:

1. **Create repository on GitHub**:
   - Go to https://github.com/new
   - Repository name: `intellibudget`
   - Create it

2. **Update remote URL**:
   ```bash
   git remote set-url origin https://github.com/Adam-J-Kanaan/intellibudget.git
   ```

3. **Push**:
   ```bash
   git push -u origin main
   ```

### Option 2: Use Personal Access Token

If you want to push to `EngAkanaan/intellibudget.git`:

1. **Create Personal Access Token**:
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` permissions
   - Copy the token

2. **Use token in push**:
   ```bash
   git remote set-url origin https://YOUR_TOKEN@github.com/EngAkanaan/intellibudget.git
   git push -u origin main
   ```

### Option 3: Use SSH (Recommended for Long-term)

1. **Generate SSH key** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **Add SSH key to GitHub**:
   - Copy public key: `cat ~/.ssh/id_ed25519.pub`
   - GitHub → Settings → SSH and GPG keys → New SSH key
   - Paste and save

3. **Update remote to use SSH**:
   ```bash
   git remote set-url origin git@github.com:EngAkanaan/intellibudget.git
   git push -u origin main
   ```

## Quick Fix Commands:

```bash
# Check current remote
git remote -v

# Update to your account
git remote set-url origin https://github.com/Adam-J-Kanaan/intellibudget.git

# Push
git push -u origin main
```

## After Successful Push:

1. Go to Vercel dashboard
2. Connect your GitHub repository
3. Auto-deploy will be set up!

