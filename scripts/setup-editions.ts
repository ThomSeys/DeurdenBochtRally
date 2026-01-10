import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

async function setupEditions() {
  console.log('🏁 Setting up Edition system...\n');

  try {
    // Step 1: Create 2026 Edition
    console.log('📅 Creating 2026 Edition...');
    const edition2026 = await client.create({
      _type: 'edition',
      year: 2026,
      name: 'Den Bochtenkoning Rally 2026',
      slug: {
        _type: 'slug',
        current: '2026',
      },
      isActive: true,
      eventDate: '2026-05-16',
      registrationOpen: true,
    });
    console.log(`✅ Created edition: ${edition2026.name} (ID: ${edition2026._id})\n`);

    // Step 2: Link all existing documents to 2026 edition
    const documentTypes = ['sponsor', 'stat', 'pricingTier', 'rallyZone', 'siteConfig'];

    for (const type of documentTypes) {
      console.log(`🔗 Linking ${type} documents to 2026 edition...`);
      
      // Get all documents of this type without an edition
      const docs = await client.fetch(
        `*[_type == $type && !defined(edition)] {_id}`,
        { type }
      );

      if (docs.length === 0) {
        console.log(`  ℹ️  No unlinked ${type} documents found`);
        continue;
      }

      // Update each document to reference the 2026 edition
      for (const doc of docs) {
        await client
          .patch(doc._id)
          .set({
            edition: {
              _type: 'reference',
              _ref: edition2026._id,
            },
          })
          .commit();
      }

      console.log(`  ✅ Linked ${docs.length} ${type} document(s)`);
    }

    console.log('\n✨ Edition setup complete!\n');
    console.log('📝 Summary:');
    console.log('  - Created "Den Bochtenkoning Rally 2026" edition');
    console.log('  - Linked all existing content to 2026 edition');
    console.log('  - 2026 edition set as ACTIVE\n');
    console.log('💡 To create a new edition for 2027:');
    console.log('  1. Go to https://deurdenbochtrally.sanity.studio');
    console.log('  2. Create new "Event Edition" document');
    console.log('  3. Set year: 2027, isActive: true');
    console.log('  4. Duplicate content from 2026 or create new\n');

  } catch (error) {
    console.error('❌ Error setting up editions:', error);
    process.exit(1);
  }
}

setupEditions();
