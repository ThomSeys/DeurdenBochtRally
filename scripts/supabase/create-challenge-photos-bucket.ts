import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../apps/web/.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createBucket() {
  console.log('📦 Creating participant-photos storage bucket...\n');

  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'participant-photos');

    if (bucketExists) {
      console.log('✅ Bucket already exists!');
      return;
    }

    // Create bucket
    const { data, error } = await supabase.storage.createBucket('participant-photos', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
    });

    if (error) {
      console.error('❌ Error creating bucket:', error);
      return;
    }

    console.log('✅ Bucket created successfully!');
    console.log('\n📸 Users can now upload challenge photos.');
    
  } catch (error) {
    console.error('❌ Failed to create bucket:', error);
  }
}

createBucket();
