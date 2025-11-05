# How to Delete an Account in Supabase

## Method 1: Delete from Supabase Dashboard (Easiest)

1. **Go to your Supabase Dashboard:**
   - https://supabase.com/dashboard/project/pfcpqljhokmrhzmlkqvt

2. **Go to Authentication → Users:**
   - Click "Authentication" in left sidebar
   - Click "Users" tab

3. **Find your user:**
   - Search for your email address
   - Or scroll through the list

4. **Delete the user:**
   - Click the three dots (⋯) next to the user
   - Click "Delete user"
   - Confirm deletion

5. **This will:**
   - Delete the user account
   - Delete ALL their data (expenses, categories, budgets, etc.) due to CASCADE DELETE
   - Free up the email for re-registration

## Method 2: Delete via SQL (Alternative)

If you prefer SQL, go to SQL Editor and run:

```sql
-- Find user ID first
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Delete user (this will cascade delete all their data)
DELETE FROM auth.users WHERE email = 'your-email@example.com';
```

---

**After deleting, you can:**
- Sign up again with the same email
- Start fresh with a clean account

