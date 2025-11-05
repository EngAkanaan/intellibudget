# 📍 Where to Find Vercel Settings

## Step-by-Step Navigation:

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. **Sign in** to your account

### Step 2: Open Your Project
1. Find **"intellibudget-dashboard"** (or your project name)
2. **Click on it** to open the project

### Step 3: Navigate to Settings
1. At the top of the project page, you'll see tabs:
   - **Overview** | **Deployments** | **Analytics** | **Settings** | etc.
2. **Click on "Settings"** tab

### Step 4: Find General Settings
1. In the left sidebar of Settings, you'll see:
   - **General** ← Click this!
   - Git
   - Environment Variables
   - Domains
   - Integrations
   - etc.

2. **Click "General"** in the left sidebar

### Step 5: Check/Update Build Settings

On the **General** page, you'll see a section called **"Build & Development Settings"** or **"Framework"**

Look for these fields:

#### **Framework Preset**
- Dropdown menu
- Should say: **"Vite"** or **"Other"**
- If it says something else, change it to **"Vite"**

#### **Root Directory**
- Text field
- Should be: **`./`** or **empty** (if your code is in the root)
- If your code is in a subfolder, enter that folder path

#### **Build Command**
- Text field
- Should say: **`npm run build`**
- If it's different, change it to: `npm run build`

#### **Output Directory**
- Text field
- Should say: **`dist`**
- This is where Vercel looks for built files

#### **Install Command**
- Text field
- Should say: **`npm install`**
- If it's different, change it to: `npm install`

#### **Node.js Version**
- Dropdown menu
- Should be: **`20.x`** or **`Latest`** or **`18.x`**
- Choose the latest LTS version (20.x recommended)

### Step 6: Save Changes
- After making changes, scroll down
- Click **"Save"** button

### Step 7: Redeploy
After saving:
1. Go to **"Deployments"** tab
2. Click **"..."** (three dots) on the latest deployment
3. Click **"Redeploy"**

Or just push a new commit:
```bash
git commit --allow-empty -m "Trigger rebuild"
git push
```

---

## Visual Guide:

```
Vercel Dashboard
  └── Your Project (intellibudget-dashboard)
      └── Settings Tab
          └── General (left sidebar)
              └── Build & Development Settings
                  ├── Framework Preset: [Vite ▼]
                  ├── Root Directory: [./]
                  ├── Build Command: [npm run build]
                  ├── Output Directory: [dist]
                  ├── Install Command: [npm install]
                  └── Node.js Version: [20.x ▼]
```

---

## Quick Checklist:

- [ ] Framework Preset = **Vite**
- [ ] Build Command = **npm run build**
- [ ] Output Directory = **dist**
- [ ] Install Command = **npm install**
- [ ] Node.js Version = **20.x** (or latest)
- [ ] Clicked **"Save"**
- [ ] Redeployed

---

**That's where you'll find all the build settings!** 🎯

