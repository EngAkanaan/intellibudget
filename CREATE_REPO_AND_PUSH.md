# 📝 Create GitHub Repository and Push Code

## Step 1: Create Repository on GitHub

1. **Go to**: https://github.com/new
2. **Repository name**: `intellibudget`
3. **Description**: "Personal Budget Management Dashboard" (optional)
4. **Visibility**: Choose Public or Private
5. **⚠️ IMPORTANT**: Do NOT check "Add a README file"
6. **⚠️ IMPORTANT**: Do NOT check "Add .gitignore"
7. **⚠️ IMPORTANT**: Do NOT check "Choose a license"
8. Click **"Create repository"**

## Step 2: Get Personal Access Token

GitHub requires a token instead of password:

1. **Go to**: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. **Note**: "IntelliBudget Push"
4. **Expiration**: 90 days (or your choice)
5. **Scopes**: Check **`repo`** (this gives all repository permissions)
6. Click **"Generate token"** at the bottom
7. **COPY THE TOKEN** - you won't see it again! (It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

## Step 3: Push Your Code

Run this command in your terminal:

```bash
git push -u origin main
```

When prompted:
- **Username**: `Adam-J-Kanaan`
- **Password**: Paste your Personal Access Token (NOT your GitHub password!)

## Step 4: Verify Push

After successful push:
- Go to: https://github.com/Adam-J-Kanaan/intellibudget
- You should see all your files!

## Step 5: Connect to Vercel

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Open your IntelliBudget project
3. Go to **Settings** → **Git**
4. Click **"Connect Git Repository"**
5. Select **GitHub** and authorize
6. Find and select `Adam-J-Kanaan/intellibudget`
7. Click **"Connect"**

## Step 6: Auto-Deploy is Ready! 🎉

Now every time you run:
```bash
git add .
git commit -m "Your message"
git push
```

Vercel will automatically deploy! ✨

---

## Troubleshooting

### "Repository not found"
- Make sure you created the repository on GitHub first
- Check the repository name matches exactly

### "Authentication failed"
- Make sure you're using a Personal Access Token, not your password
- Verify the token has `repo` scope checked

### "Permission denied"
- Make sure you're pushing to the correct account
- Check that the token is valid and not expired

