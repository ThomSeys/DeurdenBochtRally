/**
 * Reset All Sanity Data
 * Deletes ALL documents - use with caution!
 */

import { sanityClient } from './00-config';
import * as readline from 'readline';

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function resetAllData() {
  console.log('⚠️  WARNING: This will delete ALL Sanity data!\n');

  const confirmed = await confirm('Type "yes" to confirm deletion: ');

  if (!confirmed) {
    console.log('\n❌ Cancelled\n');
    return;
  }

  console.log('\n🗑️  Deleting all documents...\n');

  // Get all document IDs (both drafts and published)
  const allDocs = await sanityClient.fetch(`
    *[!(_type match "system.**")] {
      _id,
      _type
    }
  `);

  console.log(`Found ${allDocs.length} document(s) to delete\n`);

  // Delete in batches
  const batchSize = 100;
  for (let i = 0; i < allDocs.length; i += batchSize) {
    const batch = allDocs.slice(i, i + batchSize);
    const transaction = sanityClient.transaction();

    batch.forEach((doc: any) => {
      transaction.delete(doc._id);
    });

    await transaction.commit();
    console.log(`   ✓ Deleted batch ${Math.floor(i / batchSize) + 1} (${batch.length} docs)`);
  }

  console.log('\n✅ All data deleted!');
  console.log('\n📍 Next step: Run 01-setup-content.ts to recreate content\n');
}

resetAllData().catch(console.error);
