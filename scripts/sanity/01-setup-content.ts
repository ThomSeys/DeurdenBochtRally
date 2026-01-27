/**
 * Initial Sanity Content Setup
 * Creates edition, site config, and basic content structure
 */

import { sanityClient } from './00-config';

async function setupContent() {
  console.log('🚀 Setting up Sanity content...\n');

  // Check if content already exists
  const existing = await sanityClient.fetch(`
    {
      "edition": *[_type == "edition"][0],
      "siteConfig": *[_type == "siteConfig"][0]
    }
  `);

  if (existing.edition) {
    console.log('⚠️  Content already exists!');
    console.log('   Run reset-all-data.ts first if you want to start fresh.\n');
    return;
  }

  console.log('📝 Creating edition...');
  const edition = await sanityClient.create({
    _type: 'edition',
    _id: 'edition-2026',
    year: 2026,
    title: 'Deur Den Bocht 2026',
    slug: { current: '2026' },
    isActive: true,
    startDate: '2026-05-16',
    endDate: '2026-05-17',
    registrationOpenDate: '2026-01-01T00:00:00Z',
    registrationCloseDate: '2026-05-01T23:59:59Z',
    maxParticipants: 500,
    currentParticipants: 0,
  });
  console.log(`   ✓ Created: ${edition.title}`);

  console.log('\n📝 Creating site config...');
  const siteConfig = await sanityClient.create({
    _type: 'siteConfig',
    _id: 'siteConfig',
    siteName: 'Deur Den Bocht',
    siteDescription: 'De ultieme motorrit door België',
    contactEmail: 'info@deurdenbocht.be',
    socialLinks: {
      facebook: 'https://facebook.com/deurdenbocht',
      instagram: 'https://instagram.com/deurdenbocht',
    },
  });
  console.log(`   ✓ Created site config`);

  console.log('\n✅ Initial content setup complete!');
  console.log('\n📍 Next steps:');
  console.log('   1. Upload GPX route file in Sanity Studio');
  console.log('   2. Run: npm run script sanity/generate-rally-zones.ts');
  console.log('   3. Run: npm run script sanity/publish-all-drafts.ts\n');
}

setupContent().catch(console.error);
