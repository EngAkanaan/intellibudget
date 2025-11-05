# Create .env.local File

Since I can't create the `.env.local` file automatically, please create it manually:

## Steps:

1. In your project root (same folder as `package.json`), create a new file named `.env.local`

2. Copy and paste this content:

```
VITE_SUPABASE_URL=https://pfcpqljhokmrhzmlkqvt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmY3BxbGpob2ttcmh6bWxrcXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNzA0NDAsImV4cCI6MjA3Nzk0NjQ0MH0.zyIw7dl4PzSRNKGGoG_WL55r_XA--8NFI9jn6xj7W1w
```

3. Save the file

4. **Restart your dev server** if it's running:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

That's it! The environment variables are now set up.

