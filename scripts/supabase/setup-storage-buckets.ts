/**
 * Setup Storage Buckets
 * Creates required Supabase storage buckets with proper policies
 */

import { supabase } from './00-config';

const BUCKETS = [
  {
    name: 'participant-photos',
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  {
    name: 'qr-codes',
    public: true,
    fileSizeLimit: 1 * 1024 * 1024, // 1MB
    allowedMimeTypes: ['image/png'],
  },
  {
    name: 'fallback-photos',
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  {
    name: 'reports',
    public: false,
    fileSizeLimit: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: ['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
];

async function setupStorageBuckets() {
  console.log('🪣  Setting up storage buckets...\n');

  for (const bucket of BUCKETS) {
    console.log(`Creating bucket: ${bucket.name}${bucket.public ? ' (public)' : ' (private)'}`);

    // Create bucket
    const { data, error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: bucket.allowedMimeTypes,
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`   ~ Already exists`);
      } else {
        console.error(`   ❌ Error: ${error.message}`);
        continue;
      }
    } else {
      console.log(`   ✓ Created`);
    }

    // Set up policies (for public buckets)
    if (bucket.public) {
      // Note: Storage policies need to be set up via SQL or Dashboard
      console.log(`   ℹ️  Remember to set up RLS policies for ${bucket.name} bucket`);
    }
  }

  console.log('\n✅ Storage buckets setup complete!');
  console.log('\n📍 Next steps:');
  console.log('   1. Verify buckets in Supabase Dashboard > Storage');
  console.log('   2. Set up RLS policies if needed\n');
}

setupStorageBuckets().catch(console.error);
