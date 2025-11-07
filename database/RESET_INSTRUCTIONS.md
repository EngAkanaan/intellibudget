# Database Reset Instructions

This guide explains how to clear your Supabase database and start fresh.

## ⚠️ WARNING

**Both methods will DELETE ALL YOUR DATA!** Make sure you have backups if you need to keep any data.

---

## Method 1: Clear Data Only (Recommended)

**Use this if:** You want to keep table structures but delete all data.

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Go to **SQL Editor**

2. **Open the SQL file**
   - Open `database/CLEAR_ALL_DATA.sql` in a text editor
   - Copy the entire contents

3. **Run the SQL**
   - Paste into Supabase SQL Editor
   - Click **Run** or press `Ctrl+Enter`
   - Confirm if prompted

4. **Verify**
   - Run these queries to check all tables are empty:
   ```sql
   SELECT COUNT(*) FROM expenses;
   SELECT COUNT(*) FROM income_sources;
   SELECT COUNT(*) FROM budgets;
   -- etc.
   ```
   - All should return `0`

### What it does:
- ✅ Deletes all data from all tables
- ✅ Keeps table structures intact
- ✅ Keeps indexes and policies
- ✅ Quick and safe

---

## Method 2: Complete Reset (Nuclear Option)

**Use this if:** You want to completely recreate everything from scratch.

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Go to **SQL Editor**

2. **Open the SQL file**
   - Open `database/RESET_DATABASE_COMPLETE.sql` in a text editor
   - Copy the entire contents

3. **Run the SQL**
   - Paste into Supabase SQL Editor
   - Click **Run** or press `Ctrl+Enter`
   - Confirm if prompted

4. **Verify**
   - Check that all tables exist in the Table Editor
   - Verify policies are set up in Authentication > Policies

### What it does:
- ⚠️ Deletes all tables (and all data)
- ✅ Recreates all tables
- ✅ Recreates all indexes
- ✅ Recreates all RLS policies
- ✅ Complete fresh start

---

## Which Method Should I Use?

### Use Method 1 (Clear Data) if:
- You just want to remove test data
- You want to keep your table structures
- You're resetting for testing purposes
- **This is usually what you want!**

### Use Method 2 (Complete Reset) if:
- You've made changes to table structures
- You want to ensure everything matches the schema
- You're doing a complete database rebuild
- Something is corrupted

---

## Quick Reference

### Clear data only:
```sql
-- Run CLEAR_ALL_DATA.sql
```

### Complete reset:
```sql
-- Run RESET_DATABASE_COMPLETE.sql
```

### Verify tables are empty:
```sql
SELECT COUNT(*) FROM expenses;
SELECT COUNT(*) FROM income_sources;
SELECT COUNT(*) FROM budgets;
SELECT COUNT(*) FROM monthly_data;
SELECT COUNT(*) FROM user_categories;
SELECT COUNT(*) FROM payment_methods;
```

---

## After Reset

After clearing/resetting:

1. **Your app will work normally** - just with empty data
2. **Users can log in** - authentication is separate
3. **Users will see empty dashboards** - ready for new data
4. **All features will work** - just no existing data

---

## Backup Before Reset (Optional)

If you want to backup your data first:

1. Go to Supabase Dashboard > SQL Editor
2. Run export queries for each table:
   ```sql
   -- Export expenses
   SELECT * FROM expenses;
   -- Copy results or use Supabase export feature
   ```

Or use the app's built-in export feature in Settings!

---

## Troubleshooting

**Error: "Table doesn't exist"**
- Use Method 2 (Complete Reset) to recreate tables

**Error: "Permission denied"**
- Make sure you're the project owner
- Check RLS policies aren't blocking you

**Data still shows after clearing**
- Make sure you ran the correct script
- Check you're looking at the right project
- Try Method 2 for complete reset

---

**Need help?** Check the SQL files for detailed comments explaining each step.

