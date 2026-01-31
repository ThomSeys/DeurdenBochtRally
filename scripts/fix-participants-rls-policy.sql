-- Fix infinite recursion in participants RLS policy
-- This script fixes the Row Level Security policy that causes infinite recursion

-- First, let's see what policies exist
-- Run this first to see all policies:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'participants';

-- Drop ALL existing policies on participants table to start fresh
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'participants'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON participants', policy_record.policyname);
    END LOOP;
END $$;

-- Recreate simple, non-recursive policies
-- SELECT policy - users can view their own data
CREATE POLICY "participants_select_own"
ON participants
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- INSERT policy - users can insert their own data  
CREATE POLICY "participants_insert_own"
ON participants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE policy - users can update their own data
-- This is the critical one that was causing recursion
CREATE POLICY "participants_update_own"
ON participants
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE policy - users can delete their own data
CREATE POLICY "participants_delete_own"
ON participants
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Verify all policies are correctly set
SELECT 
    policyname,
    cmd,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'participants' 
ORDER BY cmd;
