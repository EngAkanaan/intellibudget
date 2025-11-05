# Migration Plan: localStorage → Supabase

## Current State
- All data is stored in localStorage (browser-specific)
- Data doesn't sync across devices
- Authentication works with Supabase

## Target State
- All data stored in Supabase (cloud database)
- Data syncs across all devices
- Real-time updates possible

## Steps
1. ✅ Import Supabase API functions
2. ⏳ Add data loading effect when user logs in
3. ⏳ Replace localStorage initialization with Supabase
4. ⏳ Replace localStorage saves with Supabase API calls
5. ⏳ Update all data manipulation functions to use Supabase
6. ⏳ Add loading states and error handling

## Key Changes
- State initialization: Load from Supabase instead of localStorage
- Data saving: Save to Supabase instead of localStorage
- All CRUD operations: Use Supabase API instead of local state updates

