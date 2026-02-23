#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');

function parseDotEnv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const out = {};
  raw.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))\s*$/i);
    if (m) out[m[1]] = m[2] || m[3] || m[4] || '';
  });
  return out;
}

async function main() {
  const root = path.resolve(__dirname, '..', '..');
  const envPath = path.join(root, '.env.vercel');
  if (!fs.existsSync(envPath)) {
    console.error('.env.vercel not found at', envPath);
    process.exit(1);
  }
  const env = parseDotEnv(envPath);
  const SANITY_TOKEN = env.SANITY_TOKEN;
  const SANITY_PROJECT_ID = env.SANITY_PROJECT_ID || 'tp2nrvnd';
  const SANITY_DATASET = env.SANITY_DATASET || 'production';

  if (!SANITY_TOKEN) {
    console.error('SANITY_TOKEN not found in .env.vercel');
    process.exit(1);
  }

  const zonesJsonPath = path.join(root, 'apps', 'web', 'app', 'rallyZones.json');
  if (!fs.existsSync(zonesJsonPath)) {
    console.error('rallyZones.json not found at', zonesJsonPath);
    process.exit(1);
  }
  const zones = JSON.parse(fs.readFileSync(zonesJsonPath, 'utf8'));
  const ids = zones.map(z => z._id || z.id).filter(Boolean);
  if (!ids.length) {
    console.log('No rallyZone ids found in rallyZones.json');
    return;
  }

  const client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    useCdn: false,
    token: SANITY_TOKEN,
    apiVersion: '2024-01-01',
  });

  for (const id of ids) {
    try {
      // delete draft if exists
      const draftId = `drafts.${id}`;
      const draftDoc = await client.getDocument(draftId);
      if (draftDoc) {
        await client.delete(draftId);
        console.log('Deleted draft', draftId);
      }
    } catch (err) {
      // ignore not-found
    }
    try {
      const doc = await client.getDocument(id);
      if (doc) {
        await client.delete(id);
        console.log('Deleted', id);
      } else {
        console.log('No published document for', id);
      }
    } catch (err) {
      // if getDocument failed because not found, attempt delete to be safe
      try {
        await client.delete(id);
        console.log('Deleted (fallback) ', id);
      } catch (e) {
        console.log('Nothing to delete for', id);
      }
    }
  }

  console.log('Done deleting rallyZone documents.');
}

main().catch(err => {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
