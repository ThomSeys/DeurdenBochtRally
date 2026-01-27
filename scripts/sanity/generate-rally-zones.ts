/**
 * Generate Rally Zone Data from Main GPX Route
 * Creates 4 rally zones with start/end points and route tip locations
 */

import { sanityClient, MAIN_GPX_PATH, Point } from './00-config';
import { readFileSync } from 'fs';

// Zone definitions
const ZONES = [
  {
    id: 'vlaamse-ardennen',
    title: 'Vlaamse Ardennen',
    location: 'Oost-Vlaanderen',
    startPercent: 0.05,
    endPercent: 0.25,
    routeTips: [
      { name: 'Paterberg & Koppenberg', type: 'panoramic', locations: [0.10, 0.15] },
      { name: 'Oudenaarde Historic Route', type: 'backroads', locations: [0.17, 0.19, 0.21] },
      { name: 'Ronse Hills', type: 'technical', locations: [0.23] },
    ],
  },
  {
    id: 'ardennen-ourthe',
    title: 'Ardennen - Ourthe Vallei',
    location: 'Luik & Namen',
    startPercent: 0.30,
    endPercent: 0.50,
    routeTips: [
      { name: 'Ourthe Valley', type: 'panoramic', locations: [0.32, 0.36, 0.39] },
      { name: 'Hamoir Curves', type: 'technical', locations: [0.42, 0.45] },
      { name: 'Durbuy Route', type: 'backroads', locations: [0.47, 0.49] },
    ],
  },
  {
    id: 'hoge-venen',
    title: 'Hoge Venen',
    location: 'Oostkantons',
    startPercent: 0.55,
    endPercent: 0.75,
    routeTips: [
      { name: 'Signal de Botrange', type: 'panoramic', locations: [0.57, 0.60, 0.63] },
      { name: 'Venen Loop', type: 'technical', locations: [0.66, 0.68, 0.70] },
      { name: 'German Border Route', type: 'backroads', locations: [0.72, 0.74] },
    ],
  },
  {
    id: 'condroz',
    title: 'Condroz',
    location: 'Namen & Luik',
    startPercent: 0.80,
    endPercent: 0.95,
    routeTips: [
      { name: 'Condroz Hills', type: 'panoramic', locations: [0.82, 0.85, 0.88] },
      { name: 'Back to Start', type: 'highway', locations: [0.91, 0.93] },
    ],
  },
];

function parseGpxContent(gpxContent: string): Point[] {
  const points: Point[] = [];
  const trkptMatches = gpxContent.matchAll(/<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g);
  
  for (const match of trkptMatches) {
    points.push({
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
    });
  }
  
  return points;
}

function getPointAtPercentage(points: Point[], percentage: number): Point {
  const index = Math.floor((points.length - 1) * percentage);
  return points[Math.max(0, Math.min(index, points.length - 1))];
}

async function generateRallyZones() {
  console.log('📍 Generating rally zones from main GPX...\n');

  // Read main GPX route
  console.log('📥 Reading GPX data from local file...');
  const gpxContent = readFileSync(MAIN_GPX_PATH, 'utf-8');
  const points = parseGpxContent(gpxContent);
  console.log(`   ✓ Parsed ${points.length} GPS points\n`);

  // Get edition
  const edition = await sanityClient.fetch(`*[_type == "edition" && isActive == true][0]`);
  if (!edition) {
    console.error('❌ No active edition found. Run 01-setup-content.ts first!');
    return;
  }

  // Generate zones
  for (const zone of ZONES) {
    console.log(`📍 Creating zone: ${zone.title}`);

    const startPoint = getPointAtPercentage(points, zone.startPercent);
    const endPoint = getPointAtPercentage(points, zone.endPercent);

    // Generate route tips with locations
    const routeTips = zone.routeTips.map((tip, idx) => ({
      name: tip.name,
      routeType: tip.type,
      description: `Explore the ${tip.name} route`,
      estimatedDistance: Math.round(20 + idx * 10),
      difficulty: 'medium' as const,
      locations: tip.locations.map((percent, locIdx) => ({
        _key: `loc-${idx}-${locIdx}`,
        _type: 'routeTipLocation',
        title: `${tip.name} Point ${locIdx + 1}`,
        description: `Interesting location along ${tip.name}`,
        location: getPointAtPercentage(points, percent),
        locationType: locIdx === 0 ? 'highlight' : 'waypoint',
      })),
    }));

    // Create draft
    const zoneDoc = {
      _type: 'rallyZone',
      _id: `drafts.${zone.id}`,
      title: zone.title,
      location: zone.location,
      is_open: false,
      startPoint,
      endPoint,
      routeTips,
    };

    await sanityClient.createOrReplace(zoneDoc);
    console.log(`   ✓ ${zone.title}: ${routeTips.length} route tips, ${routeTips.reduce((sum, rt) => sum + rt.locations.length, 0)} locations`);
  }

  console.log('\n✅ Rally zones generated!');
  console.log('\n📍 Next step: Run publish-all-drafts.ts to make them live\n');
}

generateRallyZones().catch(console.error);
