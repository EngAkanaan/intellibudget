# Fix: "Failed to fetch" Error

## Common Causes:

1. **Environment variables not loaded** - Dev server needs restart
2. **Invalid Supabase URL** - Wrong URL format
3. **CORS issue** - Supabase not configured for your domain
4. **Network issue** - Internet connection problem

## Quick Fixes:

### Step 1: Verify .env.local File

1. Check that `.env.local` exists in project root
2. Verify it contains (no extra spaces):
   ```
   VITE_SUPABASE_URL=https://pfcpqljhokmrhzmlkqvt.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmY3BxbGpob2ttcmh6bWxrcXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNzA0NDAsImV4cCI6MjA3Nzk0NjQ0MH0.zyIw7dl4PzSRNKGGoG_WL55r_XA--8NFI9jn6xj7W1w
   ```

### Step 2: Restart Dev Server

**CRITICAL:** Vite only reads `.env.local` when it starts!

1. Stop the server: `Ctrl+C` in terminal
2. Start again: `npm run dev`
3. Wait for "Local: http://localhost:3000"

### Step 3: Check Browser Console

1. Open browser console (F12)
2. Look for:
   - ✅ "Supabase client initialized" = Good
   - ❌ "Missing Supabase environment variables" = Bad (restart server)
   - ❌ "Failed to fetch" = Network/CORS issue

### Step 4: Check Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/pfcpqljhokmrhzmlkqvt
2. Check **Settings → API**:
   - Project URL should match your `.env.local`
   - Anon key should match (starts with `eyJ...`)

### Step 5: Check CORS Settings

1. In Supabase Dashboard → **Settings → API**
2. Under "CORS", make sure `http://localhost:3000` is allowed
3. Or set it to allow all origins (for development)

### Step 6: Test Connection

Open browser console and run:
```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
```

Both should show values!

---

## Still Not Working?

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Try different browser**
3. **Check firewall/antivirus** - might be blocking requests
4. **Check Supabase status**: https://status.supabase.com

---

## Network Error Details

The error should now show in browser console with more details. Check:
- What exact error message?
- What URL is it trying to connect to?
- Any CORS errors?

Share the console error details for more help!

