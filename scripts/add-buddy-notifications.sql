-- Add buddy check-in notifications
-- This will send push notifications to buddies when someone checks in at a zone

-- Function to notify buddies on check-in
CREATE OR REPLACE FUNCTION notify_buddies_on_checkin()
RETURNS TRIGGER AS $$
DECLARE
  buddy_id UUID;
  zone_name TEXT;
  participant_name TEXT;
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- Get zone name (only if table exists)
  IF to_regclass('public.rally_zones') IS NOT NULL THEN
    SELECT name INTO zone_name FROM rally_zones WHERE id = NEW.zone_id;
  ELSE
    zone_name := NULL;
  END IF;
  
  -- Get participant name
  SELECT first_name || ' ' || last_name INTO participant_name 
  FROM participants WHERE id = NEW.participant_id;
  
  -- Build notification
  notification_title := 'Buddy Check-in 📍';
  notification_body := participant_name || ' heeft ingecheckt bij ' || zone_name;
  
  -- Send notification to all buddies
  FOR buddy_id IN 
    SELECT DISTINCT buddy_id 
    FROM participant_buddies 
    WHERE participant_id = NEW.participant_id 
    AND status = 'accepted' -- Only notify accepted buddies
  LOOP
    -- Insert notification for each buddy
    -- This will be picked up by your push notification system
    INSERT INTO push_notifications_history (
      participant_id,
      title,
      body,
      data,
      sent_at,
      delivery_status
    ) VALUES (
      buddy_id,
      notification_title,
      notification_body,
      jsonb_build_object(
        'type', 'buddy_checkin',
        'buddy_id', NEW.participant_id,
        'zone_id', NEW.zone_id,
        'zone_name', zone_name,
        'checkin_id', NEW.id
      ),
      NOW(),
      'pending'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for buddy check-in notifications
DROP TRIGGER IF EXISTS after_checkin_notify_buddies ON rally_zone_checkins;
CREATE TRIGGER after_checkin_notify_buddies
AFTER INSERT ON rally_zone_checkins
FOR EACH ROW
EXECUTE FUNCTION notify_buddies_on_checkin();

-- Also trigger on checkout for completeness
CREATE OR REPLACE FUNCTION notify_buddies_on_checkout()
RETURNS TRIGGER AS $$
DECLARE
  buddy_id UUID;
  zone_name TEXT;
  participant_name TEXT;
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- Only notify if checked_out_at was just set
  IF OLD.checked_out_at IS NULL AND NEW.checked_out_at IS NOT NULL THEN
    -- Get zone name (only if table exists)
    IF to_regclass('public.rally_zones') IS NOT NULL THEN
      SELECT name INTO zone_name FROM rally_zones WHERE id = NEW.zone_id;
    ELSE
      zone_name := NULL;
    END IF;
    
    -- Get participant name
    SELECT first_name || ' ' || last_name INTO participant_name 
    FROM participants WHERE id = NEW.participant_id;
    
    -- Build notification
    notification_title := 'Buddy Vertrokken 🏍️';
    notification_body := participant_name || ' is vertrokken van ' || zone_name;
    
    -- Send notification to all buddies
    FOR buddy_id IN 
      SELECT DISTINCT buddy_id 
      FROM participant_buddies 
      WHERE participant_id = NEW.participant_id 
      AND status = 'accepted' -- Only notify accepted buddies
    LOOP
      INSERT INTO push_notifications_history (
        participant_id,
        title,
        body,
        data,
        sent_at,
        delivery_status
      ) VALUES (
        buddy_id,
        notification_title,
        notification_body,
        jsonb_build_object(
          'type', 'buddy_checkout',
          'buddy_id', NEW.participant_id,
          'zone_id', NEW.zone_id,
          'zone_name', zone_name,
          'checkin_id', NEW.id
        ),
        NOW(),
        'pending'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS after_checkout_notify_buddies ON rally_zone_checkins;
CREATE TRIGGER after_checkout_notify_buddies
AFTER UPDATE ON rally_zone_checkins
FOR EACH ROW
EXECUTE FUNCTION notify_buddies_on_checkout();
