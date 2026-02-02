-- Delete inactive push subscriptions (expired/failed subscriptions)
-- This removes subscriptions that are no longer active

DELETE FROM push_subscriptions
WHERE is_active = FALSE;

-- Show count of remaining active subscriptions
SELECT COUNT(*) as active_subscriptions 
FROM push_subscriptions 
WHERE is_active = TRUE;
