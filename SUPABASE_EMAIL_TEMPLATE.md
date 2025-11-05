# How to Customize Supabase Email Verification Email

## Step 1: Go to Supabase Dashboard

1. Open your browser and go to: https://supabase.com/dashboard/project/pfcpqljhokmrhzmlkqvt
2. Log in to your Supabase account

## Step 2: Navigate to Email Templates

1. In the left sidebar, click **"Authentication"**
2. Click **"Email Templates"** (or look for "Email Templates" in the Authentication section)

## Step 3: Edit the "Confirm signup" Template

1. Find the template called **"Confirm signup"** (or "Email Confirmation")
2. Click **"Edit"** or click on the template name

## Step 4: Customize the Email

Replace the boring default email with this friendly and funny version:

### Subject Line:
```
🎉 Welcome to IntelliBudget! Verify Your Account
```

### Email Body (HTML):
```html
<h2>🎉 Welcome to IntelliBudget!</h2>

<p>Hey there, budget superstar! 👋</p>

<p>Thanks for signing up! We're super excited to have you on board. Before you can start tracking your expenses and conquering your financial goals, we need to verify your email address.</p>

<p><strong>Ready to unlock your budget superpowers? ✨</strong></p>

<p>Just click the magical button below (or the link if buttons don't work on your device):</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    🚀 Verify My Email & Unlock Superpowers!
  </a>
</p>

<p style="text-align: center;">
  <a href="{{ .ConfirmationURL }}" style="color: #667eea; text-decoration: underline;">Or click here if the button doesn't work</a>
</p>

<p><strong>⚠️ Important Notes:</strong></p>
<ul>
  <li>This link expires in 24 hours (we don't want any sneaky hackers getting in!)</li>
  <li>If you didn't sign up for IntelliBudget, just ignore this email - no harm done!</li>
  <li>Can't see the button? Check your spam folder - sometimes emails like to hide there! 🕵️</li>
</ul>

<p>Once you verify, you'll be able to:</p>
<ul>
  <li>💰 Track all your expenses like a pro</li>
  <li>📊 See beautiful charts and insights</li>
  <li>🎯 Set and crush your savings goals</li>
  <li>📱 Access your data from any device</li>
</ul>

<p>Questions? Just reply to this email - we're here to help!</p>

<p>Happy budgeting! 🎉</p>

<p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
  Best regards,<br>
  The IntelliBudget Team<br>
  <br>
  <em>P.S. If you're having trouble, try copying and pasting this link into your browser:<br>
  {{ .ConfirmationURL }}</em>
</p>
```

### Plain Text Version (for email clients that don't support HTML):
```
🎉 Welcome to IntelliBudget!

Hey there, budget superstar! 👋

Thanks for signing up! We're super excited to have you on board. Before you can start tracking your expenses and conquering your financial goals, we need to verify your email address.

Ready to unlock your budget superpowers? ✨

Just click this link to verify your email:
{{ .ConfirmationURL }}

⚠️ Important Notes:
- This link expires in 24 hours (we don't want any sneaky hackers getting in!)
- If you didn't sign up for IntelliBudget, just ignore this email - no harm done!
- Can't see the link? Check your spam folder - sometimes emails like to hide there! 🕵️

Once you verify, you'll be able to:
💰 Track all your expenses like a pro
📊 See beautiful charts and insights
🎯 Set and crush your savings goals
📱 Access your data from any device

Questions? Just reply to this email - we're here to help!

Happy budgeting! 🎉

Best regards,
The IntelliBudget Team

P.S. If you're having trouble, try copying and pasting the link above into your browser.
```

## Step 5: Save Your Changes

1. Click **"Save"** or **"Update Template"**
2. Test it by signing up with a new account!

## Notes:

- `{{ .ConfirmationURL }}` is a special variable that Supabase replaces with the actual verification link
- You can use emojis in the email (they work in most email clients!)
- The HTML version will look prettier, but always provide a plain text fallback
- Test with your own email to see how it looks!

---

**That's it!** Now your verification emails will be friendly and fun instead of boring! 🎉

