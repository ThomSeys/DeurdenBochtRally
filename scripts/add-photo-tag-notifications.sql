-- Add photo tag and buddy request notifications

-- Function to notify when someone is tagged in a photo
CREATE OR REPLACE FUNCTION notify_on_photo_tag()
RETURNS TRIGGER AS $$
DECLARE
  tagger_name TEXT;
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- Get tagger name
  SELECT first_name || ' ' || last_name INTO tagger_name 
  FROM participants WHERE id = NEW.tagged_by;
  
  -- Build notification
  notification_title := 'Je bent getagd! 📸';
  notification_body := tagger_name || ' heeft je getagd in een foto';
  
  -- Insert notification for tagged person
  INSERT INTO push_notifications_history (
    participant_id,
    title,
    body,
    data,
    sent_at,
    delivery_status
  ) VALUES (
    NEW.participant_id, -- The person who was tagged
    notification_title,
    notification_body,
    jsonb_build_object(
      'type', 'photo_tag',
      'photo_id', NEW.photo_id,
      'tagged_by', NEW.tagged_by,
      'tagger_name', tagger_name
    ),
    NOW(),
    'pending'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for photo tag notifications
DROP TRIGGER IF EXISTS after_photo_tag_notify ON photo_tags;
CREATE TRIGGER after_photo_tag_notify
AFTER INSERT ON photo_tags
FOR EACH ROW
EXECUTE FUNCTION notify_on_photo_tag();

-- Function to notify when someone receives a buddy request
CREATE OR REPLACE FUNCTION notify_on_buddy_request()
RETURNS TRIGGER AS $$
DECLARE
  requester_name TEXT;
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- Only notify on new pending requests
  IF NEW.status = 'pending' THEN
    -- Get requester name
    SELECT first_name || ' ' || last_name INTO requester_name 
    FROM participants WHERE id = NEW.participant_id;
    
    -- Build notification
    notification_title := 'Nieuw Naftgenoot Verzoek 🏍️';
    notification_body := requester_name || ' wil je naftgenoot worden!';
    
    -- Insert notification for the buddy (receiver)
    INSERT INTO push_notifications_history (
      participant_id,
      title,
      body,
      data,
      sent_at,
      delivery_status
    ) VALUES (
      NEW.buddy_id, -- The person who receives the request
      notification_title,
      notification_body,
      jsonb_build_object(
        'type', 'buddy_request',
        'request_id', NEW.id,
        'requester_id', NEW.participant_id,
        'requester_name', requester_name
      ),
      NOW(),
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for buddy request notifications
DROP TRIGGER IF EXISTS after_buddy_request_notify ON riding_buddies;
CREATE TRIGGER after_buddy_request_notify
AFTER INSERT ON riding_buddies
FOR EACH ROW
EXECUTE FUNCTION notify_on_buddy_request();

-- Function to notify when buddy request is accepted
CREATE OR REPLACE FUNCTION notify_on_buddy_accept()
RETURNS TRIGGER AS $$
DECLARE
  accepter_name TEXT;
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- Only notify when status changes from pending to accepted
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Get accepter name (the person who accepted)
    SELECT first_name || ' ' || last_name INTO accepter_name 
    FROM participants WHERE id = NEW.buddy_id;
    
    -- Build notification
    notification_title := 'Naftgenoot Geaccepteerd! 🎉';
    notification_body := accepter_name || ' heeft je verzoek geaccepteerd!';
    
    -- Notify the requester
    INSERT INTO push_notifications_history (
      participant_id,
      title,
      body,
      data,
      sent_at,
      delivery_status
    ) VALUES (
      NEW.participant_id, -- The person who sent the original request
      notification_title,
      notification_body,
      jsonb_build_object(
        'type', 'buddy_accepted',
        'buddy_id', NEW.buddy_id,
        'accepter_name', accepter_name
      ),
      NOW(),
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for buddy acceptance notifications
DROP TRIGGER IF EXISTS after_buddy_accept_notify ON riding_buddies;
CREATE TRIGGER after_buddy_accept_notify
AFTER UPDATE ON riding_buddies
FOR EACH ROW
EXECUTE FUNCTION notify_on_buddy_accept();
