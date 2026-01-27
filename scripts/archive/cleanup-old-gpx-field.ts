import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  token: 'skaD4StBLox7QnIavzjPBYrPNjemIOMgeeGzq8IECjOsmGMUQdQ4QXLifygEqOlL5lTxlMORN21tvsR1kUrkSvHbhe45pZnAwZXfsS0EEiCl9MSyTOoNYXQgCBH3vSdIyvY3YZ7ZCP5jznUPGXxphuG5IGG0TEXstNsIuT84bBKn0RLDRYGs',
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
