-- Create event_checklist_items table for pre-event preparation
CREATE TABLE IF NOT EXISTS event_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('material', 'staff', 'zones', 'catering', 'other')),
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_tasks table for during-event task management
CREATE TABLE IF NOT EXISTS event_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    assigned_to TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklist_category ON event_checklist_items(category);
CREATE INDEX IF NOT EXISTS idx_checklist_completed ON event_checklist_items(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON event_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON event_tasks(priority);

-- Add RLS policies
ALTER TABLE event_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;

-- Admin-only access for checklist items
CREATE POLICY "Admins can do everything with checklist items"
    ON event_checklist_items
    FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM participants WHERE is_admin = true
    ));

-- Admin-only access for event tasks
CREATE POLICY "Admins can do everything with event tasks"
    ON event_tasks
    FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM participants WHERE is_admin = true
    ));

-- Add emergency_contact fields to participants table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='participants' AND column_name='emergency_contact_name') THEN
        ALTER TABLE participants ADD COLUMN emergency_contact_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='participants' AND column_name='emergency_contact_phone') THEN
        ALTER TABLE participants ADD COLUMN emergency_contact_phone TEXT;
    END IF;
END $$;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at
DROP TRIGGER IF EXISTS update_checklist_updated_at ON event_checklist_items;
CREATE TRIGGER update_checklist_updated_at
    BEFORE UPDATE ON event_checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON event_tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON event_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some default checklist items
INSERT INTO event_checklist_items (title, category) VALUES
    ('Startlocatie materiaal klaar zetten', 'material'),
    ('Rally zone borden plaatsen', 'material'),
    ('QR codes printen en lamineren', 'material'),
    ('Staff briefing houden', 'staff'),
    ('Marshals toewijzen aan zones', 'staff'),
    ('Communicatie apparatuur testen', 'staff'),
    ('Zone 1-8 markeren en controleren', 'zones'),
    ('GPS coördinaten verifiëren', 'zones'),
    ('Catering bevestiging ontvangen', 'catering'),
    ('Maaltijden aantallen doorgeven', 'catering')
ON CONFLICT DO NOTHING;

-- Comment the tables
COMMENT ON TABLE event_checklist_items IS 'Pre-event preparation checklist items for admins';
COMMENT ON TABLE event_tasks IS 'During-event task management and issue tracking';
