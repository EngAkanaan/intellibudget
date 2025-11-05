# ⚠️ IMPORTANT: Create .env.local File

The login page isn't showing because the `.env.local` file is missing!

## Quick Fix:

1. **Create a new file** in your project root (same folder as `package.json`)
2. **Name it exactly:** `.env.local` (with the dot at the beginning)
3. **Copy and paste this content:**

```
VITE_SUPABASE_URL=https://pfcpqljhokmrhzmlkqvt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmY3BxbGpob2ttcmh6bWxrcXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNzA0NDAsImV4cCI6MjA3Nzk0NjQ0MH0.zyIw7dl4PzSRNKGGoG_WL55r_XA--8NFI9jn6xj7W1w
```

4. **Save the file**

5. **IMPORTANT: Restart your dev server:**
   - Stop the current server (Ctrl+C in terminal)
   - Run `npm run dev` again

6. **Refresh your browser** (hard refresh: Ctrl+Shift+R or Ctrl+F5)

---

## How to create .env.local in VS Code:

1. Right-click in the project root folder
2. Select "New File"
3. Type `.env.local` (including the dot!)
4. Paste the content above
5. Save

---

## Verify it worked:

After restarting, open browser console (F12) and check:
- You should NOT see warnings about "Missing Supabase environment variables"
- The login page should appear

