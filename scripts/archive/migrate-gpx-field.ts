import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  token: 'skaD4StBLox7QnIavzjPBYrPNjemIOMgeeGzq8IECjOsmGMUQdQ4QXLifygEqOlL5lTxlMORN21tvsR1kUrkSvHbhe45pZnAwZXfsS0EEiCl9MSyTOoNYXQgCBH3vSdIyvY3YZ7ZCP5jznUPGXxphuG5IGG0TEXstNsIuT84bBKn0RLDRYGs',
  apiVersion: '2023-05-03',
  useCdn: false,
});

async function migrateGpxField() {
  console.log('🔄 Migrating gpxRouteFile to gpxRouteFiles...\n');
  
  // Get siteConfig with old field
  const siteConfig = await client.fetch(`
    *[_type == "siteConfig"][0] {
      _id,
      gpxRouteFile,
      gpxRouteFiles
    }
  `);
  
  if (!siteConfig) {
    console.log('❌ No siteConfig found');
    return;
  }
  
  console.log('Current data:');
  console.log('  gpxRouteFile:', siteConfig.gpxRouteFile ? '✓ exists' : '✗ empty');
  console.log('  gpxRouteFiles:', siteConfig.gpxRouteFiles ? `✓ ${siteConfig.gpxRouteFiles.length} files` : '✗ empty');
  
  // If old field exists and new field is empty, migrate
  if (siteConfig.gpxRouteFile && (!siteConfig.gpxRouteFiles || siteConfig.gpxRouteFiles.length === 0)) {
    console.log('\n📦 Migrating old field to new array field...');
    
    const docId = siteConfig._id.replace('drafts.', '');
    
    try {
      await client
        .patch(docId)
        .set({
          gpxRouteFiles: [siteConfig.gpxRouteFile]
        })
        .commit();
      
      console.log('✅ Migration successful!');
      console.log('   gpxRouteFiles now contains 1 file');
      
      // Try draft version too
      try {
        await client
          .patch(`drafts.${docId}`)
          .set({
            gpxRouteFiles: [siteConfig.gpxRouteFile]
          })
          .commit();
        console.log('✅ Draft version also migrated');
      } catch (e) {
        console.log('⏭️  No draft version');
      }
      
    } catch (error) {
      console.log('❌ Migration failed:', error);
    }
  } else if (siteConfig.gpxRouteFiles && siteConfig.gpxRouteFiles.length > 0) {
    console.log('\n✅ Already migrated - gpxRouteFiles has data');
  } else {
    console.log('\n⚠️  No GPX file data found in either field');
  }
}

migrateGpxField().catch(console.error);
