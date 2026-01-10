import { createClient } from '@sanity/client';
import { sponsors } from '../apps/web/app/content/sponsors';
import { siteConfig, stats } from '../apps/web/app/content/config';

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN, // Create token at sanity.io/manage
  useCdn: false,
});

async function importData() {
  console.log('🚀 Starting data import to Sanity...\n');

  try {
    // Import Site Config
    console.log('📝 Importing site configuration...');
    const configDoc = {
      _type: 'siteConfig',
      eventName: siteConfig.event.name,
      eventDate: siteConfig.event.date,
      eventLocation: siteConfig.event.location,
      eventTagline: siteConfig.event.tagline,
      contactEmail: siteConfig.contact.email,
      contactWhatsapp: siteConfig.contact.whatsapp,
      contactLocation: siteConfig.contact.location,
      socialFacebook: siteConfig.social.facebook,
      socialInstagram: siteConfig.social.instagram,
      socialStrava: siteConfig.social.strava,
    };
    await client.create(configDoc);
    console.log('✅ Site config imported!\n');

    // Import Stats
    console.log('📊 Importing stats...');
    const statsData = [
      { label: 'Kilometer', value: '500+', icon: '🏍️' },
      { label: 'Rally Zones', value: '8', icon: '🗺️' },
      { label: 'Landen', value: '3', icon: '🌍' },
      { label: 'Snelheid', value: '0', icon: '🚫' },
    ];
    
    for (const [index, stat] of statsData.entries()) {
      const statDoc = {
        _type: 'stat',
        label: stat.label,
        value: stat.value,
        icon: stat.icon,
        order: index,
      };
      await client.create(statDoc);
      console.log(`  ✓ ${stat.icon} ${stat.label}: ${stat.value}`);
    }
    console.log('✅ All stats imported!\n');

    // Import Sponsors
    console.log('🤝 Importing sponsors...');
    for (const sponsor of sponsors) {
      const sponsorDoc = {
        _type: 'sponsor',
        name: sponsor.name,
        website: sponsor.website,
        order: sponsor.id,
        // Note: Logo images need to be uploaded manually or via Sanity assets API
      };
      await client.create(sponsorDoc);
      console.log(`  ✓ ${sponsor.name}`);
    }
    console.log('✅ All sponsors imported!\n');

    // Import Pricing Tiers
    console.log('💰 Importing pricing tiers...');
    const pricingTiers = [
      {
        _type: 'pricingTier',
        name: 'Met maaltijden',
        price: 20,
        features: [
          'Ontbijt included',
          'Lunch included',
          'Avondmaal included',
          'Routeboek',
          'Rally sticker',
        ],
        highlighted: true,
        order: 0,
      },
      {
        _type: 'pricingTier',
        name: 'Alleen ontbijt',
        price: 10,
        features: [
          'Ontbijt included',
          'Routeboek',
          'Rally sticker',
        ],
        highlighted: false,
        order: 1,
      },
    ];

    for (const tier of pricingTiers) {
      await client.create(tier);
      console.log(`  ✓ ${tier.name} - €${tier.price}`);
    }
    console.log('✅ All pricing tiers imported!\n');

    console.log('🎉 Import complete! All data has been imported to Sanity.\n');
    console.log('📝 Next steps:');
    console.log('   1. Visit https://deurdenbochtrally.sanity.studio');
    console.log('   2. Upload sponsor logos manually');
    console.log('   3. Add rally zones with images');
    console.log('   4. Customize content as needed\n');
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
}

importData();
