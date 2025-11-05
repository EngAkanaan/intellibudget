# ⚙️ Vercel Webhook/Event Settings Guide

## Recommended Settings for IntelliBudget:

### ✅ **deployment_status Events: Enable**
**What it does**: Sends deployment status updates back to GitHub
- Shows deployment status in GitHub (✅ success, ❌ failed)
- Creates GitHub commit status checks
- Useful for seeing if deployments succeeded

**Recommendation**: **✅ KEEP ENABLED** - This is helpful to see deployment status in GitHub

---

### ⚠️ **repository_dispatch Events: Enable**
**What it does**: Allows manual deployments via GitHub API
- Lets you trigger deployments manually
- Can be used for custom workflows
- Not needed for normal auto-deploy

**Recommendation**: **✅ KEEP ENABLED** - Doesn't hurt, might be useful later

---

### ❌ **Pull Request Comments: Disable**
**What it does**: Comments on PRs with preview deployment links
- Automatically comments on Pull Requests with preview URLs
- Useful for teams reviewing code
- Can clutter PRs if not needed

**Recommendation**: **✅ KEEP DISABLED** - You're working solo, so not needed

---

### ❌ **Commit Comments: Disable**
**What it does**: Comments on commits with deployment links
- Posts comments on every commit
- Can spam your commit history
- Usually not needed

**Recommendation**: **✅ KEEP DISABLED** - Prevents commit spam

---

## ✅ **Recommended Configuration:**

```
✅ Pull Request Comments:     Disable
✅ Commit Comments:           Disable  
✅ deployment_status Events:  Enable
✅ repository_dispatch Events: Enable
```

## Why These Settings?

- **deployment_status Events: Enable** → See deployment status in GitHub
- **repository_dispatch Events: Enable** → Allows manual deployments if needed
- **Pull Request Comments: Disable** → No PR spam (you're working solo)
- **Commit Comments: Disable** → No commit spam

---

**Your current settings are perfect! ✅** Just keep them as they are.

