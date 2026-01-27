import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

async function updateSeoSettings() {
  console.log('🔒 Enabling noindex and nofollow for SEO protection...\n');

  try {
    // Get the siteConfig document
    const config = await client.fetch(`*[_type == "siteConfig"][0]`);
    
    if (!config) {
      console.error('❌ No siteConfig found!');
      process.exit(1);
    }

    console.log(`Found config: ${config._id}`);
    
    // Update with SEO settings
    await client
      .patch(config._id)
      .set({
        noIndex: true,
        noFollow: true,
        seoTitle: config.eventName || 'Den Bochtenkoning Rally 2026',
        seoDescription: 'Een unieke 500+ km motordag door België, Noord-Frankrijk en de Ardennen. Geen race, geen tijdsdruk. Gewoon pure vrijheid op twee wielen. Start & Finish: café Belami, Aalter.'
      })
      .commit();

    console.log('✅ Successfully enabled noindex and nofollow!');
    console.log('\n📝 Current settings:');
    console.log('   - noIndex: ✓ ENABLED (search engines will NOT index the site)');
    console.log('   - noFollow: ✓ ENABLED (search engines will NOT follow links)');
    console.log('\n💡 To allow indexing when ready to launch:');
    console.log('   1. Go to https://deurdenbochtrally.sanity.studio');
    console.log('   2. Open Site Configuration');
    console.log('   3. Uncheck "No Index" and "No Follow"');
    console.log('   4. Save & Publish\n');
  } catch (error) {
    console.error('❌ Error updating SEO settings:', error);
    process.exit(1);
  }
}

updateSeoSettings();
