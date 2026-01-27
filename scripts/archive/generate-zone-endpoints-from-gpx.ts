import { createClient } from '@sanity/client';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  token: 'skaD4StBLox7QnIavzjPBYrPNjemIOMgeeGzq8IECjOsmGMUQdQ4QXLifygEqOlL5lTxlMORN21tvsR1kUrkSvHbhe45pZnAwZXfsS0EEiCl9MSyTOoNYXQgCBH3vSdIyvY3YZ7ZCP5jznUPGXxphuG5IGG0TEXstNsIuT84bBKn0RLDRYGs',
  apiVersion: '2023-05-03',
  useCdn: false,
});

// Map GPX files to zone titles
const zoneGpxMap: Record<string, string> = {
  'rz1-leie-valley-loop.gpx': 'Vlaamse Ardennen',
  'rz6-ardennen-panorama-route.gpx': 'Ardennen - Ourthe Vallei',
  'rz8-signal-de-botrange-finale.gpx': 'Hoge Venen',
  'rz5-samber-valley-challenge.gpx': 'Condroz',
};

interface Point {
  lat: number;
  lng: number;
}

function parseGpxFile(filePath: string): Point[] {
  const gpxContent = readFileSync(filePath, 'utf-8');
  
  const points: Point[] = [];
  const trkptMatches = gpxContent.matchAll(/<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g);
  
  for (const match of trkptMatches) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    
    if (lat && lng) {
      points.push({ lat, lng });
    }
  }
  
  return points;
}

function getRouteEndpoints(points: Point[]): { start: Point; end: Point } {
  // Get start point (first point)
  const start = points[0];
  
  // Get end point (last point)
  const end = points[points.length - 1];
  
  return { start, end };
}

async function generateZoneEndpoints() {
  console.log('📍 Analyzing GPX routes and updating zone endpoints...\n');
  
  const gpxDir = join(process.cwd(), 'apps/web/public/gpx/zones');
  const gpxFiles = readdirSync(gpxDir).filter(f => f.endsWith('.gpx'));
  
  for (const gpxFile of gpxFiles) {
    const zoneTitle = zoneGpxMap[gpxFile];
    
    if (!zoneTitle) {
      console.log(`⏭️  Skipping ${gpxFile} - no zone mapping`);
      continue;
    }
    
    const gpxPath = join(gpxDir, gpxFile);
    const points = parseGpxFile(gpxPath);
    
    if (points.length === 0) {
      console.log(`⚠️  No points found in ${gpxFile}`);
      continue;
    }
    
    const { start, end } = getRouteEndpoints(points);
    
    console.log(`\n📍 ${zoneTitle} (${gpxFile})`);
    console.log(`   ${points.length} points in route`);
    console.log(`   Start: ${start.lat.toFixed(4)}, ${start.lng.toFixed(4)}`);
    console.log(`   End: ${end.lat.toFixed(4)}, ${end.lng.toFixed(4)}`);
    
    // Find the zone document
    const zones = await client.fetch(
      `*[_type == "rallyZone" && title == $title]`,
      { title: zoneTitle }
    );
    
    if (zones.length === 0) {
      console.log(`   ⚠️  Zone not found in Sanity`);
      continue;
    }
    
    const zone = zones[0];
    const docId = zone._id.replace('drafts.', '');
    
    // Update published version
    try {
      await client
        .patch(docId)
        .set({
          startPoint: start,
          endPoint: end,
        })
        .commit();
      console.log(`   ✅ Updated published version`);
    } catch (error) {
      console.log(`   ⚠️  Error updating published:`, error);
    }
    
    // Check if draft exists
    const draftExists = await client.fetch(
      `*[_id == $draftId][0]`,
      { draftId: `drafts.${docId}` }
    );
    
    if (draftExists) {
      try {
        await client
          .patch(`drafts.${docId}`)
          .set({
            startPoint: start,
            endPoint: end,
          })
          .commit();
        console.log(`   ✅ Updated draft version`);
      } catch (error) {
        console.log(`   ⚠️  Error updating draft:`, error);
      }
    }
  }
  
  console.log('\n✨ Done!');
}

generateZoneEndpoints().catch(console.error);
