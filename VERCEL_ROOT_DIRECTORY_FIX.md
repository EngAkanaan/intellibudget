# 🔧 Fix: Vercel Can't Find package.json

## The Problem
Vercel is looking for `package.json` in the repository root, but your project is in the `intellibudget-dashboard` subdirectory.

## ✅ Solution Applied
I've updated `vercel.json` to specify the root directory. **But you also need to configure it in Vercel Dashboard:**

### Step 1: Go to Vercel Settings
1. Vercel Dashboard → Your Project → **Settings** → **General**

### Step 2: Set Root Directory
Look for **"Root Directory"** field (usually in Build & Development Settings section).

Set it to:
```
intellibudget-dashboard
```

### Step 3: Verify Build Settings
Make sure these match:
- **Root Directory**: `intellibudget-dashboard` ✅
- **Build Command**: `npm run build` (Vercel will run this from the root directory)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Save and Redeploy
1. Click **"Save"**
2. Go to **Deployments** tab
3. Click **"..."** on latest deployment
4. Click **"Redeploy"**

## Alternative: If Root Directory Setting Doesn't Exist

If Vercel doesn't have a "Root Directory" setting, the `vercel.json` file should handle it. The updated config is:

```json
{
  "buildCommand": "cd intellibudget-dashboard && npm install && npm run build",
  "outputDirectory": "intellibudget-dashboard/dist",
  "framework": "vite",
  "installCommand": "cd intellibudget-dashboard && npm install",
  "rootDirectory": "intellibudget-dashboard"
}
```

This tells Vercel:
- The project is in `intellibudget-dashboard/` folder
- Build from that directory
- Output to `intellibudget-dashboard/dist/`

---

**After setting the Root Directory in Vercel Dashboard, the build should work!** 🚀

