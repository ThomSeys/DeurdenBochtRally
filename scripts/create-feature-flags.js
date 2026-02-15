// scripts/create-feature-flags.js
// Usage: SANITY_PROJECT_ID=.. SANITY_DATASET=.. SANITY_TOKEN=.. node scripts/create-feature-flags.js

require('dotenv').config();
const sanityClient = require('@sanity/client');

const client = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || 'production',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
});

const flags = [
  {
    key: 'public-participants-list',
    name: 'Public participants list',
    category: 'privacy',
    description: 'Toggle whether the participants list is visible publicly.',
    enabled: false,
  },
  {
    key: 'photo-uploads-public',
    name: 'Photo uploads (public albums)',
    category: 'content',
    description: 'Allow participants to upload photos that are visible in public event albums.',
    enabled: false,
  },
  {
    key: 'route-challenges-reveal',
    name: 'Route challenges (reveal)',
    category: 'rally',
    description: 'Reveal route challenges/checkpoints to participants.',
    enabled: false,
  },
];

async function createFlags() {
  try {
    for (const f of flags) {
      const id = `featureFlags.${f.key}`;
      const doc = {
        _id: id,
        _type: 'featureFlags',
        name: f.name,
        key: { current: f.key },
        enabled: f.enabled,
        category: f.category,
        description: f.description,
        enabledFrom: null,
        enabledUntil: null,
      };

      const res = await client.createIfNotExists(doc);
      console.log(`Ensured flag: ${f.key} -> ${res._id}`);
    }
    console.log('Done. If you want to (re)apply changes, rerun this script after adjusting env vars.');
  } catch (err) {
    console.error('Failed to create flags:', err);
    process.exit(1);
  }
}

createFlags();
