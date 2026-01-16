import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: 'apps/web/.env.local' });

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

/**
 * Migration script to convert existing single-checkpoint zones
 * to the new multi-checkpoint structure with zone types
 * 
 * Recommended distribution for 8 zones:
 * - 2 short zones (Type A)
 * - 4 medium zones (Type B)
 * - 2 long zones (Type C)
 */

interface ZoneMapping {
  zoneNumber: number;
  zoneType: 'short' | 'medium' | 'long';
  estimatedDistance: number;
  checkpointCount: 1 | 2 | 3;
}

// Define which zones should be which type
// This is a suggested distribution - adjust based on actual route design
const zoneMappings: ZoneMapping[] = [
  { zoneNumber: 1, zoneType: 'short', estimatedDistance: 8, checkpointCount: 1 },
  { zoneNumber: 2, zoneType: 'medium', estimatedDistance: 18, checkpointCount: 2 },
  { zoneNumber: 3, zoneType: 'medium', estimatedDistance: 20, checkpointCount: 2 },
  { zoneNumber: 4, zoneType: 'long', estimatedDistance: 35, checkpointCount: 3 },
  { zoneNumber: 5, zoneType: 'medium', estimatedDistance: 22, checkpointCount: 2 },
  { zoneNumber: 6, zoneType: 'short', estimatedDistance: 6, checkpointCount: 1 },
  { zoneNumber: 7, zoneType: 'medium', estimatedDistance: 19, checkpointCount: 2 },
  { zoneNumber: 8, zoneType: 'long', estimatedDistance: 40, checkpointCount: 3 },
];

async function migrateToMultiCheckpoint() {
  console.log('🚀 Starting multi-checkpoint migration...\n');

  try {
    // Fetch all rally zones
    const zones = await client.fetch<Array<{
      _id: string;
      title: string;
      order: number;
      checkpoint?: string;
      codeHint?: string;
      solution?: string;
      validAnswers?: string[];
    }>>(
      `*[_type == "rallyZone"] | order(order asc) {
        _id,
        title,
        order,
        checkpoint,
        codeHint,
        solution,
        validAnswers
      }`
    );

    console.log(`Found ${zones.length} rally zones to migrate\n`);

    for (const zone of zones) {
      const zoneNumber = zone.order + 1;
      const mapping = zoneMappings.find(m => m.zoneNumber === zoneNumber);

      if (!mapping) {
        console.warn(`⚠️  No mapping found for zone ${zoneNumber}, skipping...`);
        continue;
      }

      console.log(`\n📍 Migrating Zone ${zoneNumber}: ${zone.title}`);
      console.log(`   Type: ${mapping.zoneType} (${mapping.checkpointCount} checkpoint${mapping.checkpointCount > 1 ? 's' : ''})`);

      // Create checkpoint array from legacy fields
      const checkpoints = [];
      
      if (zone.checkpoint && zone.solution) {
        // First checkpoint from existing data
        checkpoints.push({
          _type: 'checkpoint',
          name: `Checkpoint 1`,
          description: zone.checkpoint,
          codeHint: zone.codeHint || 'Zoek de code',
          solution: zone.solution,
          validAnswers: zone.validAnswers || [zone.solution],
        });

        // Add placeholder checkpoints for medium/long zones
        if (mapping.checkpointCount >= 2) {
          checkpoints.push({
            _type: 'checkpoint',
            name: `Checkpoint 2`,
            description: 'Te definiëren - tweede checkpoint',
            codeHint: 'Woord of nummer',
            solution: 'PLACEHOLDER2',
            validAnswers: ['PLACEHOLDER2'],
          });
        }

        if (mapping.checkpointCount === 3) {
          checkpoints.push({
            _type: 'checkpoint',
            name: `Checkpoint 3`,
            description: 'Te definiëren - derde checkpoint',
            codeHint: 'Zoek verder',
            solution: 'PLACEHOLDER3',
            validAnswers: ['PLACEHOLDER3'],
          });
        }
      }

      // Update the zone
      await client
        .patch(zone._id)
        .set({
          zoneType: mapping.zoneType,
          estimatedDistance: mapping.estimatedDistance,
          checkpoints: checkpoints.length > 0 ? checkpoints : undefined,
        })
        .commit();

      console.log(`   ✅ Migrated with ${checkpoints.length} checkpoint(s)`);
    }

    console.log('\n\n✨ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Review the migrated zones in Sanity Studio');
    console.log('   2. Update placeholder checkpoints for medium/long zones');
    console.log('   3. Add GPS coordinates for each checkpoint');
    console.log('   4. Run the database migration: add-multi-checkpoint-system.sql');
    console.log('   5. Test submission forms with new checkpoint structure');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateToMultiCheckpoint();
