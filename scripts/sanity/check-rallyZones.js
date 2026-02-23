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
  const env = parseDotEnv(envPath);
  const client = createClient({
    projectId: env.SANITY_PROJECT_ID,
    dataset: env.SANITY_DATASET || 'production',
    useCdn: false,
    token: env.SANITY_TOKEN,
    apiVersion: '2024-01-01',
  });

  try {
    const published = await client.fetch('*[_type == "rallyZone"]{_id, title, _createdAt, _updatedAt, startPoint, endPoint, edition, image, gpxRoute, skipRoute}');
    const drafts = await client.fetch('*[_id match "drafts.*" && _type == "rallyZone"]{_id, title, _createdAt, _updatedAt, startPoint, endPoint}');

    console.log('Published rallyZone count:', published.length);
    published.forEach(d => console.log('PUB:', d._id, '| title:', d.title || '-', '| updated:', d._updatedAt));
    console.log('Draft rallyZone count:', drafts.length);
    drafts.forEach(d => console.log('DRF:', d._id, '| title:', d.title || '-', '| updated:', d._updatedAt));
  } catch (err) {
    console.error('Error querying Sanity:', err.message || err);
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
