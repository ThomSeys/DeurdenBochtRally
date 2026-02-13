#!/usr/bin/env node
/* Insert a rally_zone_checkins record using Supabase admin client.
   Usage: set -a && source .env.vercel && set +a && node scripts/insert-checkin.js
*/
require('dotenv').config({ path: '.env.vercel' });
const { createClient } = require('@supabase/supabase-js');
async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  if (!url || !key) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment.');
    process.exit(2);
  }

  const supabase = createClient(url, key);

  const participantId = 'f18f13e7-6c8c-4e52-a0ce-74b3a63e03d6';
  const zoneId = '1';

  try {
    const payload = {
      participant_id: participantId,
      zone_id: zoneId,
      location_lat: null,
      location_lng: null,
    };

    const { data, error } = await supabase.from('rally_zone_checkins').insert(payload).select();
    if (error) {
      console.error('Insert error:', error);
      process.exit(3);
    }

    console.log('Inserted check-in:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(4);
  }
}

main();
