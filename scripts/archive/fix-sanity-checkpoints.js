require('dotenv').config({ path: './apps/web/.env.local' });
const sanityClient = require('@sanity/client').createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN
});

(async () => {
  console.log('🔧 Fixing Sanity checkpoint counts...\n');

  // Zone distribution mapping (based on design)
  const zoneMapping = {
    1: { type: 'short', checkpoints: 1 },
    2: { type: 'medium', checkpoints: 2 },
    3: { type: 'medium', checkpoints: 2 },
    4: { type: 'long', checkpoints: 3 },
    5: { type: 'medium', checkpoints: 2 },
    6: { type: 'short', checkpoints: 1 },
    7: { type: 'medium', checkpoints: 2 },
    8: { type: 'long', checkpoints: 3 },
  };

  // Fetch all zones
  const zones = await sanityClient.fetch(`
    *[_type == "rallyZone"] | order(order asc) {
      _id,
      title,
      order,
      "zoneNumber": order + 1,
      zoneType,
      checkpoints,
      checkpoint,
      codeHint,
      solution,
      validAnswers
    }
  `);

  console.log(`Found ${zones.length} zones\n`);

  for (const zone of zones) {
    const zoneNum = zone.zoneNumber;
    const expected = zoneMapping[zoneNum];
    const currentCount = zone.checkpoints?.length || 0;

    console.log(`Zone ${zoneNum}: ${zone.zoneType} - has ${currentCount}, needs ${expected.checkpoints}`);

    if (currentCount === expected.checkpoints && zone.zoneType === expected.type) {
      console.log(`  ✓ Already correct\n`);
      continue;
    }

    // Build the correct checkpoints array
    const checkpoints = [];
    
    for (let i = 1; i <= expected.checkpoints; i++) {
      // Use existing checkpoint data if available
      const existingCheckpoint = zone.checkpoints?.[i - 1];
      
      if (existingCheckpoint && existingCheckpoint.name && existingCheckpoint.solution) {
        // Keep existing checkpoint
        checkpoints.push(existingCheckpoint);
        console.log(`  ✓ Kept existing checkpoint ${i}`);
      } else if (i === 1 && zone.checkpoint) {
        // Use legacy single checkpoint for first checkpoint
        checkpoints.push({
          _type: 'object',
          name: 'Checkpoint 1',
          description: zone.checkpoint,
          codeHint: zone.codeHint || 'Kijk goed om je heen',
          solution: zone.solution || 'CHANGEME',
          validAnswers: zone.validAnswers || []
        });
        console.log(`  ✓ Created checkpoint 1 from legacy data`);
      } else {
        // Create placeholder checkpoint
        checkpoints.push({
          _type: 'object',
          name: `Checkpoint ${i}`,
          description: `Te definiëren - checkpoint ${i}`,
          codeHint: 'Hint nog in te vullen',
          solution: `PLACEHOLDER${i}`,
          validAnswers: []
        });
        console.log(`  + Created placeholder checkpoint ${i}`);
      }
    }

    // Update the zone
    await sanityClient
      .patch(zone._id)
      .set({
        zoneType: expected.type,
        checkpoints: checkpoints
      })
      .commit();

    console.log(`  ✅ Updated Zone ${zoneNum}\n`);
  }

  console.log('✨ All zones fixed!');
})();
