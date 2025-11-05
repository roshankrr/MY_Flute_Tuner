# Debugging Song Delete Issue

I've added detailed logging to help identify the exact issue. Follow these steps:

## Step 1: Check Browser Console

1. Open your app in the browser
2. Open Developer Tools (F12 or Right-click → Inspect)
3. Go to the **Console** tab
4. Try to delete a song
5. Look for these log messages:
   - `Attempting to delete song with ID: ...`
   - `Sending delete request to Supabase...`
   - `Delete response: ...`

**What to look for:**
- If you see an error message, note the `code` and `message`
- Common error codes:
  - `42501` or `PGRST301` = Permission denied (RLS issue)
  - `23503` = Foreign key constraint violation
  - `22P02` = Invalid UUID format

## Step 2: Check Supabase Dashboard

### Option A: Disable RLS (Quickest Fix)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Table Editor** in the left sidebar
4. Find and click on the `practice_songs` table
5. Look for the **shield icon** with "RLS" text at the top
6. If it says **"RLS enabled"**, click it to **disable RLS**
7. Try deleting a song again

### Option B: Add Delete Policy (More Secure)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Authentication** → **Policies** in the left sidebar
4. Find `practice_songs` table
5. Click **"New Policy"**
6. Choose **"For full customization"**
7. Fill in:
   - **Policy name**: `Allow public deletes`
   - **Policy command**: `DELETE`
   - **Target roles**: `public`
   - **USING expression**: `true`
8. Click **"Review"** then **"Save policy"**

### Option C: Use SQL Editor (Advanced)

1. Go to **SQL Editor** in Supabase dashboard
2. Run this SQL:

```sql
-- First, check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'practice_songs';

-- If rowsecurity is true, you need to add policies
-- Option 1: Disable RLS (not recommended for production)
ALTER TABLE practice_songs DISABLE ROW LEVEL SECURITY;

-- Option 2: Add delete policy
CREATE POLICY "Allow public deletes"
ON practice_songs
FOR DELETE
TO public
USING (true);

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'practice_songs';
```

## Step 3: Verify Database Setup

### Check if table exists:

```sql
SELECT * FROM practice_songs LIMIT 5;
```

### Check if songs have valid IDs:

```sql
SELECT id, title FROM practice_songs;
```

Make sure the `id` column is a valid UUID format.

## Step 4: Test with SQL

Try deleting directly via SQL to isolate the issue:

```sql
-- Get a song ID
SELECT id, title FROM practice_songs LIMIT 1;

-- Try to delete it (replace YOUR_SONG_ID with actual ID)
DELETE FROM practice_songs WHERE id = 'YOUR_SONG_ID';
```

If this works but the app doesn't, the issue is with policies.
If this doesn't work, check for foreign key constraints.

## Common Issues & Solutions

### Issue 1: "new row violates row-level security policy"
**Solution**: Disable RLS or add proper policies (see Option A or B above)

### Issue 2: Nothing happens (no error, no success)
**Solution**:
- Check browser console for errors
- Make sure you're clicking the trash icon, not the card
- Verify Supabase connection in Network tab

### Issue 3: "Failed to fetch" or network error
**Solution**:
- Check your Supabase URL and API key in `.env` file
- Make sure your internet connection is working
- Check Supabase project status

### Issue 4: Foreign key constraint violation
**Solution**: If other tables reference practice_songs, you need to:
```sql
-- Option 1: Delete with CASCADE
ALTER TABLE practice_songs
DROP CONSTRAINT IF EXISTS constraint_name CASCADE;

-- Option 2: Delete related records first
```

## Step 5: Report Back

After trying the steps above, check the browser console and let me know:
1. What error code you see (if any)
2. What the error message says
3. Whether RLS is enabled or disabled
4. Whether the SQL delete works directly

This will help me provide a more specific solution!
