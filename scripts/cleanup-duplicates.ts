import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

async function cleanupDuplicates() {
  console.log('🧹 Cleaning up duplicate documents in Sanity...\n');

  try {
    // Get all documents grouped by type
    const documentTypes = ['sponsor', 'stat', 'pricingTier', 'rallyZone', 'siteConfig'];

    for (const type of documentTypes) {
      console.log(`\n📋 Checking ${type} documents...`);
      
      // Fetch all documents of this type
      const docs = await client.fetch(
        `*[_type == $type] | order(_createdAt asc) {_id, _createdAt, title, name, label}`,
        { type }
      );

      if (docs.length === 0) {
        console.log(`  ℹ️  No ${type} documents found`);
        continue;
      }

      console.log(`  Found ${docs.length} documents`);

      // For siteConfig, keep only the first one
      if (type === 'siteConfig' && docs.length > 1) {
        console.log(`  ⚠️  Found ${docs.length} site config documents, keeping first one...`);
        const toDelete = docs.slice(1);
        for (const doc of toDelete) {
          await client.delete(doc._id);
          console.log(`    ✓ Deleted duplicate: ${doc._id}`);
        }
        continue;
      }

      // For other types, we'll keep the last created version of each
      // Group by content similarity
      const seenContent = new Map();
      const toDelete = [];

      for (const doc of docs) {
        // Create a unique key based on content
        const key = doc.title || doc.name || doc.label || 'unknown';
        
        if (seenContent.has(key)) {
          // This is a duplicate - mark the older one for deletion
          const existing = seenContent.get(key);
          if (new Date(doc._createdAt) > new Date(existing._createdAt)) {
            // Current doc is newer, delete the old one
            toDelete.push(existing);
            seenContent.set(key, doc);
          } else {
            // Existing doc is newer, delete current
            toDelete.push(doc);
          }
        } else {
          seenContent.set(key, doc);
        }
      }

      if (toDelete.length > 0) {
        console.log(`  ⚠️  Found ${toDelete.length} duplicates, removing...`);
        for (const doc of toDelete) {
          await client.delete(doc._id);
          const displayName = doc.title || doc.name || doc.label || doc._id;
          console.log(`    ✓ Deleted: ${displayName}`);
        }
      } else {
        console.log(`  ✅ No duplicates found`);
      }
    }

    console.log('\n✅ Cleanup complete!\n');
    console.log('📝 Summary: All duplicate documents have been removed.');
    console.log('   Visit https://deurdenbochtrally.sanity.studio to verify.\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDuplicates();
