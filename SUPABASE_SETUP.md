# Supabase Database Setup

If you're experiencing issues with deleting songs or other database operations, you likely need to configure Row Level Security (RLS) policies in Supabase.

## Quick Fix: Disable RLS (For Development Only)

**Warning: This makes your database publicly accessible. Only use for development/testing.**

1. Go to your Supabase Dashboard
2. Click on "Table Editor" in the left sidebar
3. Select the `practice_songs` table
4. Click on "RLS disabled" toggle to disable Row Level Security

## Recommended: Enable RLS with Proper Policies

For a more secure setup, keep RLS enabled and add these policies:

### Option 1: Via Supabase Dashboard

1. Go to Authentication > Policies
2. Select the `practice_songs` table
3. Click "New Policy"
4. Create the following policies:

#### Policy 1: Enable Read for All
- Policy name: `Enable read access for all users`
- Allowed operation: `SELECT`
- Target roles: `public`
- Policy definition: `true`

#### Policy 2: Enable Insert for All
- Policy name: `Enable insert for all users`
- Allowed operation: `INSERT`
- Target roles: `public`
- Policy definition: `true`

#### Policy 3: Enable Update for All
- Policy name: `Enable update for all users`
- Allowed operation: `UPDATE`
- Target roles: `public`
- Policy definition: `true`

#### Policy 4: Enable Delete for All
- Policy name: `Enable delete for all users`
- Allowed operation: `DELETE`
- Target roles: `public`
- Policy definition: `true`

### Option 2: Via SQL Editor

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable RLS on practice_songs table
ALTER TABLE practice_songs ENABLE ROW LEVEL SECURITY;

-- Create policies for practice_songs
CREATE POLICY "Enable read access for all users" ON practice_songs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for all users" ON practice_songs
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON practice_songs
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON practice_songs
  FOR DELETE
  TO public
  USING (true);
```

## For Other Tables

If you have similar issues with other tables (swars, game_scores, etc.), apply the same policies:

```sql
-- For swars table
ALTER TABLE swars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for swars" ON swars
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- For game_scores table
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for game_scores" ON game_scores
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
```

## Verification

After setting up policies, try:
1. Adding a new song
2. Viewing songs
3. Deleting a song
4. Updating a song

All operations should work without errors.

## Production Considerations

For production, consider:
- Implementing authentication (Supabase Auth)
- Restricting policies based on authenticated users
- Adding user ownership checks
- Rate limiting

Example authenticated policy:
```sql
CREATE POLICY "Users can only delete their own songs" ON practice_songs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```
