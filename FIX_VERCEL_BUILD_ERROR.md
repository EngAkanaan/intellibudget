# 🔧 Fix "vite: command not found" Error

## The Problem
Vercel is trying to run `vite build` directly, but `vite` is not in the PATH. It needs to run via npm.

## Solution: Update Vercel Settings

### Step 1: Go to Vercel Settings
1. Vercel Dashboard → Your Project → **Settings** → **General**

### Step 2: Update Build Command

In the **"Build Command"** field, make sure it says:

```
npm run build
```

**NOT** `vite build` or `vite build --mode production`

### Step 3: Verify All Settings

Make sure these are correct:

- **Framework Preset**: `Vite`
- **Build Command**: `npm run build` ✅
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Development Command**: Can be empty or `npm run dev` (optional)

### Step 4: Save and Redeploy

1. Click **"Save"**
2. Go to **Deployments** tab
3. Click **"..."** on latest deployment
4. Click **"Redeploy"**

## Alternative: If Settings Don't Work

If the settings don't stick, the `vercel.json` file should override them. I've already updated it to:

```json
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

This ensures:
1. Dependencies are installed first
2. Then `npm run build` runs (which calls `vite build` internally)

## Why This Happens

Vercel might be auto-detecting the framework and trying to run `vite build` directly, but `vite` is only available after `npm install` runs and is in `node_modules/.bin/`. Running `npm run build` ensures the correct path is used.

---

**After updating the Build Command to `npm run build`, the build should work!**

