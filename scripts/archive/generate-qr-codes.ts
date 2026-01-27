import { createClient } from '@supabase/supabase-js';
import { generateAndSaveQRCode } from '../apps/web/app/lib/qrcode.server';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from root directory
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:');
  console.error('SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  throw new Error('Missing Supabase credentials. Make sure .env file exists in root directory.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateQRCodesForExistingUsers() {
  console.log('Fetching participants without QR code images...');
  
  const { data: participants, error } = await supabase
    .from('participants')
    .select('id, qr_code, qr_code_image_url')
    .is('qr_code_image_url', null);

  if (error) {
    console.error('Error fetching participants:', error);
    return;
  }

  if (!participants || participants.length === 0) {
    console.log('All participants already have QR code images!');
    return;
  }

  console.log(`Found ${participants.length} participants without QR code images`);

  for (const participant of participants) {
    try {
      console.log(`Generating QR code for participant ${participant.id}...`);
      
      const qrCodeImageUrl = await generateAndSaveQRCode(participant.qr_code, participant.id);
      
      const { error: updateError } = await supabase
        .from('participants')
        .update({ qr_code_image_url: qrCodeImageUrl })
        .eq('id', participant.id);

      if (updateError) {
        console.error(`Error updating participant ${participant.id}:`, updateError);
      } else {
        console.log(`✓ Successfully generated QR code for ${participant.id}`);
      }
    } catch (err) {
      console.error(`Error processing participant ${participant.id}:`, err);
    }
  }

  console.log('Done!');
}

generateQRCodesForExistingUsers();
