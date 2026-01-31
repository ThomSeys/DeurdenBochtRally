-- Fix RLS policies for buddy achievements to allow service_role access
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their group achievements" ON buddy_group_achievements;
DROP POLICY IF EXISTS "Users can view group achievement members" ON buddy_group_achievement_members;

-- Recreate with service_role bypass
CREATE POLICY "Users can view their group achievements" ON buddy_group_achievements FOR SELECT 
  USING (
    auth.role() = 'service_role' OR
    primary_participant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM buddy_group_achievement_members
      WHERE buddy_group_achievement_members.group_achievement_id = buddy_group_achievements.id
      AND buddy_group_achievement_members.participant_id = auth.uid()
    )
  );

CREATE POLICY "Users can view group achievement members" ON buddy_group_achievement_members FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    participant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM buddy_group_achievement_members bgam2
      WHERE bgam2.group_achievement_id = buddy_group_achievement_members.group_achievement_id
      AND bgam2.participant_id = auth.uid()
    )
  );
