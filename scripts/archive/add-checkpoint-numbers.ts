import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN || '',
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function addCheckpointNumbers() {
  console.log('Fetching all rally zones...');
  
  const zones = await client.fetch(`*[_type == "rallyZone"] | order(order asc) {
    _id,
    order,
    title,
    checkpoints[] {
      _key,
      name
    }
  }`);

  console.log(`Found ${zones.length} zones`);

  for (const zone of zones) {
    console.log(`\nProcessing Zone ${zone.order}: ${zone.title}`);
    
    if (!zone.checkpoints || zone.checkpoints.length === 0) {
      console.log('  No checkpoints, skipping');
      continue;
    }

    // Build patches to add checkpointNumber to each checkpoint
    const patches = zone.checkpoints.map((cp: any, index: number) => {
      const checkpointNumber = index + 1;
      console.log(`  Adding checkpointNumber=${checkpointNumber} to checkpoint: ${cp.name}`);
      
      return {
        // Use array item matching by _key
        patch: {
          id: zone._id,
          set: {
            [`checkpoints[_key=="${cp._key}"].checkpointNumber`]: checkpointNumber
          }
        }
      };
    });

    // Execute patches
    for (const { patch } of patches) {
      try {
        await client.patch(patch.id).set(patch.set).commit();
        console.log(`  ✓ Updated checkpoint`);
      } catch (error) {
        console.error(`  ✗ Failed to update:`, error);
      }
    }
  }

  console.log('\n✓ All checkpoints updated with checkpoint numbers!');
}

addCheckpointNumbers().catch(console.error);
