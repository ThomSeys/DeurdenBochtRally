import fs from 'fs';
import path from 'path';
import sanityClient from '@sanity/client';

async function main() {
  const root = path.resolve(__dirname, '..', '..');
  const payloadPath = path.join(root, 'scripts', 'sanity-payload.json');
  if (!fs.existsSync(payloadPath)) {
    console.error('Payload not found:', payloadPath);
    process.exit(1);
  }
  const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));

  const client = sanityClient({
    projectId: 'tp2nrvnd',
    dataset: 'production',
    useCdn: false,
    token: process.env.SANITY_TOKEN,
    apiVersion: '2024-01-01',
  });

  if (!process.env.SANITY_TOKEN) {
    console.error('SANITY_TOKEN not set. Export it and try again.');
    process.exit(1);
  }

  for (const doc of payload) {
    try {
      // create or replace document
      await client.createOrReplace(doc);
      console.log('Upserted', doc._id);
    } catch (err) {
      console.error('Error upserting', doc._id, err);
    }
  }
  process.exit(0);
}

main();
