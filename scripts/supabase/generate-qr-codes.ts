/**
 * Generate QR Codes for Existing Participants
 * Creates QR code images for participants who don't have one yet
 */

import { supabase } from './00-config';
import QRCode from 'qrcode';

async function generateAndSaveQRCode(qrCodeText: string, participantId: string): Promise<string> {
  // Generate QR code as data URL
  const qrCodeDataURL = await QRCode.toDataURL(qrCodeText, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 512,
    margin: 2,
  });

  // Convert data URL to buffer
  const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // Upload to Supabase storage
  const fileName = `${participantId}.png`;
  const { data, error } = await supabase.storage
    .from('qr-codes')
    .upload(fileName, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload QR code: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('qr-codes')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

async function generateQRCodes() {
  console.log('🔲 Generating QR codes for participants...\n');

  // Get participants without QR code images
  const { data: participants, error } = await supabase
    .from('participants')
    .select('id, qr_code, qr_code_image_url, first_name, last_name')
    .is('qr_code_image_url', null);

  if (error) {
    console.error('❌ Error fetching participants:', error.message);
    return;
  }

  if (!participants || participants.length === 0) {
    console.log('✅ All participants already have QR code images!\n');
    return;
  }

  console.log(`Found ${participants.length} participant(s) without QR codes\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const participant of participants) {
    try {
      console.log(`Generating QR code for ${participant.first_name} ${participant.last_name}...`);

      const qrCodeImageUrl = await generateAndSaveQRCode(participant.qr_code, participant.id);

      const { error: updateError } = await supabase
        .from('participants')
        .update({ qr_code_image_url: qrCodeImageUrl })
        .eq('id', participant.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`   ✓ Success`);
      successCount++;
    } catch (err: any) {
      console.error(`   ❌ Error: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n✅ Complete! ${successCount} generated, ${errorCount} errors\n`);
}

generateQRCodes().catch(console.error);
