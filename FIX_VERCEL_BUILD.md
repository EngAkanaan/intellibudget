# 🔧 Fix Vercel Build Error (Exit Code 127)

## The Problem
Exit code 127 means "command not found" - Vercel can't find the `vite` command.

## Solution: Verify Vercel Build Settings

### Step 1: Check Vercel Project Settings

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Click your **IntelliBudget project**
3. Go to **Settings** → **General**
4. Check these settings:

   **Framework Preset**: `Vite`
   
   **Root Directory**: `./` (leave empty if in root)
   
   **Build Command**: `npm run build`
   
   **Output Directory**: `dist`
   
   **Install Command**: `npm install`
   
   **Node.js Version**: `20.x` (or latest LTS)

### Step 2: Check Environment Variables

Make sure these are set in **Settings** → **Environment Variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PRODUCTION_URL` (your Vercel URL)

### Step 3: Verify package.json

Make sure your `package.json` has:
- ✅ `"build": "vite build"` in scripts
- ✅ `vite` in devDependencies

### Step 4: Check Node Version

Vercel might need a specific Node version. Add this to `package.json`:

```json
"engines": {
  "node": ">=18.0.0"
}
```

### Step 5: Redeploy

After updating settings:
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

Or trigger a new deployment by pushing to GitHub:
```bash
git add .
git commit -m "Fix: Update Vercel build configuration"
git push
```

## Alternative: Use Vercel CLI to Debug

```bash
vercel --prod
```

This will show you the actual error message from Vercel.

## Common Causes:

1. **Wrong Framework Preset** → Should be "Vite"
2. **Wrong Build Command** → Should be "npm run build"
3. **Wrong Output Directory** → Should be "dist"
4. **Missing node_modules** → Make sure `npm install` runs
5. **Node version mismatch** → Check Node version in settings

---

**Try updating the Vercel settings first, then redeploy!**

