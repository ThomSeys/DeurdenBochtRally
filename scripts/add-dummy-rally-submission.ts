import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from apps/web/.env.local
try {
  const envPath = resolve(__dirname, '../apps/web/.env.local');
  const envFile = readFileSync(envPath, 'utf-8');
  
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
} catch (error) {
  console.log('Could not load .env.local, using existing environment variables');
}

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  console.log('Either run: source apps/web/.env.local');
  console.log('Or ensure apps/web/.env.local exists with these variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addDummyRallySubmission() {
  // Get first participant
  const { data: participants } = await supabase
    .from('participants')
    .select('id, first_name, last_name, email')
    .limit(5);

  if (!participants || participants.length === 0) {
    console.error('No participants found');
    return;
  }

  console.log('\nAvailable participants:');
  participants.forEach((p, i) => {
    console.log(`${i + 1}. ${p.first_name} ${p.last_name} (${p.email}) - ID: ${p.id}`);
  });

  // Use the first participant
  const participant = participants[0];
  console.log(`\nAdding dummy submission for: ${participant.first_name} ${participant.last_name}`);

  // Check if submission already exists
  const { data: existing } = await supabase
    .from('rally_submissions')
    .select('id')
    .eq('participant_id', participant.id)
    .single();

  if (existing) {
    console.log('Submission already exists, updating...');
    
    const { error } = await supabase
      .from('rally_submissions')
      .update({
        rz1_code: 'Nieuwe Brug',
        rz2_code: 'Dracula',
        rz3_code: 'Kasteel',
        rz4_code: 'Windmolen',
        rz5_code: 'Kerk',
        rz6_code: 'Station',
        rz7_code: 'Museum',
        rz8_code: 'Park',
        total_distance: 450,
        start_km: 42355,
        end_km: 42805,
        used_highways: false,
        weather_bonus: true,
        total_points: 80,
        shadow_total: 15,
        final_score: 95,
        submitted_at: new Date().toISOString(),
        start_km_locked: true,
        end_km_locked: true
      })
      .eq('participant_id', participant.id);

    if (error) {
      console.error('Error updating submission:', error);
    } else {
      console.log('✅ Dummy rally submission updated successfully!');
    }
  } else {
    console.log('Creating new submission...');
    
    const { error } = await supabase
      .from('rally_submissions')
      .insert({
        participant_id: participant.id,
        rz1_code: 'Nieuwe Brug',
        rz2_code: 'Dracula',
        rz3_code: 'Kasteel',
        rz4_code: 'Windmolen',
        rz5_code: 'Kerk',
        rz6_code: 'Station',
        rz7_code: 'Museum',
        rz8_code: 'Park',
        total_distance: 450,
        start_km: 42355,
        end_km: 42805,
        used_highways: false,
        weather_bonus: true,
        total_points: 80,
        shadow_total: 15,
        final_score: 95,
        submitted_at: new Date().toISOString(),
        start_km_locked: true,
        end_km_locked: true
      });

    if (error) {
      console.error('Error creating submission:', error);
    } else {
      console.log('✅ Dummy rally submission created successfully!');
    }
  }

  console.log(`\nYou can now view this at: /admin/participants/${participant.id}/submissions`);
}

addDummyRallySubmission();
