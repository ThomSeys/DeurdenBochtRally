import dotenv from 'dotenv';
import { createClient } from '@sanity/client';

// Load environment variables
dotenv.config({ path: 'apps/web/.env.local' });

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function checkCheckpoints() {
  console.log('🔍 Checking Rally Zone checkpoints in Sanity...\n');

  const zones = await client.fetch(
    `*[_type == "rallyZone"] | order(order asc) {
      _id,
      title,
      order,
      checkpoints[] {
        name,
        solution,
        validAnswers
      }
    }`
  );

  for (const zone of zones) {
    console.log(`\n📍 ${zone.title} (order: ${zone.order})`);
    console.log(`   ID: ${zone._id}`);
    
    if (zone.checkpoints && zone.checkpoints.length > 0) {
      console.log(`   ✅ Has ${zone.checkpoints.length} checkpoint(s):`);
      zone.checkpoints.forEach((cp: any, idx: number) => {
        console.log(`      ${idx + 1}. ${cp.name}`);
        console.log(`         Solution: ${cp.solution || 'MISSING'}`);
        console.log(`         Valid answers: ${cp.validAnswers?.length || 0} (${cp.validAnswers?.join(', ') || 'NONE'})`);
      });
    } else {
      console.log(`   ❌ No checkpoints array!`);
    }
  }
}

checkCheckpoints().catch(console.error);
