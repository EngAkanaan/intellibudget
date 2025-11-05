# Enable Email Verification in Supabase

## Step 1: Configure Email Settings in Supabase

1. **Go to your Supabase Dashboard:**
   - https://supabase.com/dashboard/project/pfcpqljhokmrhzmlkqvt

2. **Go to Authentication → Settings:**
   - Click "Authentication" in left sidebar
   - Click "Settings" tab

3. **Enable Email Auth:**
   - Under "Auth Providers", make sure "Email" is enabled ✅
   - Toggle it ON if it's off

4. **Configure Email Settings:**
   - Scroll to "Email Templates" section
   - Make sure "Enable email confirmations" is ON
   - Set "Confirm email" to: **Enabled** ✅

5. **Configure Email Redirect URLs:**
   - Under "Redirect URLs", add:
     - `http://localhost:3000`
     - `http://localhost:3000/**`
     - (We'll add production URL later)

6. **Save changes**

## Step 2: Configure SMTP (Optional but Recommended)

For production, you'll want to use your own email provider, but for now Supabase's default email will work.

---

## Step 3: Check Error Messages

When you try to sign up/login, check the browser console (F12) for error messages. Common issues:

1. **"Email rate limit exceeded"** - Too many signup attempts
2. **"Invalid email"** - Email format issue
3. **"Password too weak"** - Need stronger password
4. **"Email already registered"** - Account exists, try login instead

---

## Step 4: Test Email Verification

After signing up:
1. Check your email inbox (and spam folder)
2. Click the verification link
3. You'll be redirected back to the app
4. You should be automatically logged in

---

## Troubleshooting

If emails aren't arriving:
- Check spam/junk folder
- Wait a few minutes (can take 1-2 minutes)
- Verify email address is correct
- Check Supabase dashboard → Logs for email sending errors

