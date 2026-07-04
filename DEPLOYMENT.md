# Deployment Guide

## Environment Variables Setup

Your application requires the following environment variables to work properly:

### Required Variables

1. **VITE_SUPABASE_URL**
   - Your Supabase project URL
   - Format: `https://xxxxx.supabase.co`
   - Found in: Supabase Dashboard → Settings → API → Project URL

2. **VITE_SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Found in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

### Setting Up Environment Variables

#### For Vercel Deployment

1. Go to your Vercel Dashboard
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add both variables:
   - Name: `VITE_SUPABASE_URL`, Value: `https://your-project.supabase.co`
   - Name: `VITE_SUPABASE_ANON_KEY`, Value: `your-anon-key`
5. Select **Production**, **Preview**, and **Development** environments (or at least Production)
6. Click **Save**
7. **Redeploy** your application (go to Deployments → click "..." → Redeploy)

#### For Local Development

1. Create a `.env.local` file in the project root
2. Add:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Restart your dev server: `npm run dev`

## Supabase Project Pausing

If you're on Supabase's free tier:
- Projects can pause after ~7 days of inactivity
- They **automatically resume** when you access them (no action needed)
- First request after pausing may take 5-10 seconds to wake up
- Your application will work normally after the initial delay

**Note**: Resuming the project in Supabase dashboard is NOT required - it happens automatically when accessed.

## Troubleshooting "Load Failed" Errors

### Check 1: Environment Variables
- Open browser console (F12) on your deployed site
- Look for: `🔍 Supabase Config Check:`
- If you see `❌ Missing`, environment variables are not set correctly in Vercel

### Check 2: Supabase Project Status
- Go to Supabase Dashboard
- Check if your project is paused
- If paused, it will auto-resume on first access (wait 5-10 seconds)

### Check 3: Network Issues
- Check browser console for network errors
- Verify your internet connection
- Try accessing your Supabase project URL directly in browser

### Check 4: CORS/API Issues
- Verify Supabase project is active
- Check Supabase Dashboard → Settings → API for any restrictions
- Ensure your domain is not blocked

## Getting Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **Project API keys** → `anon` `public` key → Use for `VITE_SUPABASE_ANON_KEY`

## Verification

After setting up environment variables and redeploying:

1. Open your deployed application
2. Open browser console (F12)
3. You should see: `✅ Supabase client initialized`
4. Try logging in - it should work without errors

## AI Budget Agent (Edge Function)

The `budget-agent-parse` function runs Gemini on the server so your API key is never exposed in the browser.

### Prerequisites

1. [Supabase CLI](https://supabase.com/docs/guides/cli) installed
2. A [Google AI Studio](https://aistudio.google.com/apikey) API key for Gemini
3. `agent_notes` table applied (`database/agent_notes_schema.sql`)

### One-time setup

Use the **same Supabase account** that owns your project (the one where you see `pfcpqljhokmrhzmlkqvt` in the dashboard).

```powershell
cd path\to\intellibudget-dashboard
.\scripts\deploy-budget-agent.ps1
```

Or manually (no `link` required):

```bash
supabase login
supabase projects list   # must include pfcpqljhokmrhzmlkqvt
supabase secrets set --project-ref pfcpqljhokmrhzmlkqvt GEMINI_API_KEY=your-gemini-api-key
supabase functions deploy budget-agent-parse --project-ref pfcpqljhokmrhzmlkqvt --use-api
```

Gemini key: [Google AI Studio](https://aistudio.google.com/apikey) (usually starts with `AIza`).

Optional model override:

```bash
supabase secrets set --project-ref pfcpqljhokmrhzmlkqvt GEMINI_MODEL=gemini-1.5-flash
```

### Troubleshooting CLI deploy

**`Your account does not have the necessary privileges`**

The CLI is logged into a different Supabase user than the project owner.

1. Open [Supabase Dashboard](https://supabase.com/dashboard) in the browser — note which email/account sees project `pfcpqljhokmrhzmlkqvt`.
2. In terminal: `supabase logout` then `supabase login` and sign in with **that** account.
3. Or create an [access token](https://supabase.com/dashboard/account/tokens) on that account and run:
   ```bash
   supabase login --token sbp_xxxxxxxx
   ```
4. Run `supabase projects list` — your project ref must appear before deploy will work.

**`.env.local` / unexpected character `»`**

The file was saved with a UTF-8 BOM. Re-save as UTF-8 without BOM, or run `.\scripts\deploy-budget-agent.ps1` (it strips BOM automatically).

**Set secrets in Dashboard (no CLI)**

Project → **Edge Functions** → **Secrets** → add `GEMINI_API_KEY`. Deploy still needs CLI or Dashboard deploy with correct account.

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected automatically for Edge Functions. Do **not** put `GEMINI_API_KEY` in `.env.local` or Vite — it stays in Supabase secrets only.

### Test from the dashboard

Supabase Dashboard → Edge Functions → `budget-agent-parse` → Test with a body like:

```json
{
  "noteText": "Spent $45 on groceries at Costco yesterday with Visa",
  "intent": "auto"
}
```

Use an authenticated user's JWT in the `Authorization` header (`Bearer <access_token>` from the app session).

### Frontend usage

```ts
import { budgetAgentApi } from './services/budgetAgentApi';

const result = await budgetAgentApi.parseAndStoreNote({
  noteId: note.id,
  noteText: note.text,
  intent: 'auto',
});
// result.actions, result.warnings, note row updated in agent_notes
```


