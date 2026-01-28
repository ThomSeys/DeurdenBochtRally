import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN || '',
  apiVersion: '2023-05-03',
  useCdn: false,
});

async function cleanupOldGpxField() {
  console.log('🧹 Removing old gpxRouteFile field from siteConfig...\n');
  
  const siteConfig = await client.fetch(`*[_type == "siteConfig"][0]._id`);
  
  if (!siteConfig) {
    console.log('❌ No siteConfig found');
    return;
  }
  
  try {
    await client
      .patch(siteConfig)
      .unset(['gpxRouteFile'])
      .commit();
    
    console.log('✅ Removed gpxRouteFile field from published version');
  } catch (error) {
    console.log('⚠️  Error or field already removed:', error);
  }
}

cleanupOldGpxField().catch(console.error);
