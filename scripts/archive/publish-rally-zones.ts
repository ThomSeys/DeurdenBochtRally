import { createClient } from '@sanity/client';
import 'dotenv/config';

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN || '',
  apiVersion: '2023-05-03',
  useCdn: false,
});

async function publishAllDrafts() {
  console.log('📤 Publishing all rally zone drafts...\n');

  // Fetch all draft rally zones
  const drafts = await sanityClient.fetch(`*[_type == "rallyZone" && _id in path("drafts.**")]`);
  
  console.log(`Found ${drafts.length} draft zones to publish\n`);

  for (const draft of drafts) {
    const publishedId = draft._id.replace('drafts.', '');
    
    console.log(`📝 Publishing: ${draft.title}`);
    console.log(`   Draft ID: ${draft._id}`);
    console.log(`   Published ID: ${publishedId}`);

    try {
      // Create a copy without the draft prefix
      const { _id, _rev, ...draftData } = draft;
      
      // Create or update the published version
      await sanityClient
        .createOrReplace({
          ...draftData,
          _id: publishedId,
          _type: 'rallyZone',
        });

      console.log(`   ✅ Published successfully\n`);
    } catch (error) {
      console.error(`   ❌ Error publishing:`, error);
    }
  }

  console.log('✅ All drafts published!');
}

publishAllDrafts().catch(console.error);
