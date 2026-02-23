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
(async function main(){
  const root = path.resolve(__dirname, '..', '..');
  const envPath = path.join(root, '.env.vercel');
  if (!fs.existsSync(envPath)) { console.error('.env.vercel not found'); process.exit(1); }
  const env = parseDotEnv(envPath);
  const client = createClient({ projectId: env.SANITY_PROJECT_ID || 'tp2nrvnd', dataset: env.SANITY_DATASET || 'production', token: env.SANITY_TOKEN, useCdn:false, apiVersion:'2024-01-01' });
  const ids = ['rallyZone-1','rallyZone-2','rallyZone-3','rallyZone-4'];
  for (const id of ids) {
    try {
      const doc = await client.getDocument(id);
      console.log('\n---', id, '---');
      if (!doc) { console.log('not found'); continue; }
      console.log('title:', doc.title);
      console.log('location:', doc.location);
      console.log('startPoint:', doc.startPoint);
      console.log('routeTips count:', Array.isArray(doc.routeTips)?doc.routeTips.length:0);
      if (Array.isArray(doc.routeTips)) {
        doc.routeTips.forEach((rt, i)=>{
          console.log(`  routeTip[${i}]: name=${rt.name||''} desc=${(rt.description||'').slice(0,120)} locations=${Array.isArray(rt.locations)?rt.locations.length:0}`);
        });
      }
    } catch (err) { console.error('err fetching', id, err.message); }
  }
})();