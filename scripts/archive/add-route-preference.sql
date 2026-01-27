-- Add route_preference column to participants table
-- This allows participants to choose between rally zones (adventure track) or complete route

ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS route_preference TEXT DEFAULT 'rally_zones' 
CHECK (route_preference IN ('rally_zones', 'complete_route'));

COMMENT ON COLUMN participants.route_preference IS 'Participant preference: rally_zones (adventure track with zones) or complete_route (full route without zones)';
