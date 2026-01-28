import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN || '',
  apiVersion: '2023-05-03',
  useCdn: false,
});

interface Point {
  lat: number;
  lng: number;
}

function parseGpxContent(gpxContent: string): Point[] {
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

function getPointAtPercentage(points: Point[], percentage: number): Point {
  const index = Math.floor((points.length - 1) * percentage);
  return points[Math.max(0, Math.min(index, points.length - 1))];
}

async function generateZoneDataFromMainGpx() {
  console.log('📍 Analyzing main GPX route and generating zone data...\n');
  
  // Get the main GPX route from siteConfig
  const siteConfig = await client.fetch(`
    *[_type == "siteConfig"][0] {
      gpxRouteFiles[] {
        asset-> {
          url
        }
      }
    }
  `);
  
  if (!siteConfig?.gpxRouteFiles?.[0]?.asset?.url) {
    console.log('❌ No GPX route file found in site configuration');
    return;
  }
  
  const gpxUrl = siteConfig.gpxRouteFiles[0].asset.url;
  console.log(`📥 Fetching GPX from: ${gpxUrl}\n`);
  
  // Fetch the GPX file
  const response = await fetch(gpxUrl);
  const gpxContent = await response.text();
  const points = parseGpxContent(gpxContent);
  
  console.log(`✅ Parsed ${points.length} points from GPX\n`);
  
  // Define zone segments along the route (percentages of total route)
  const zoneSegments = [
    {
      title: 'Vlaamse Ardennen',
      startPct: 0.05,    // 5% into route
      endPct: 0.25,      // 25% into route
      highlights: [
        { pct: 0.10, name: 'Koppenberg', type: 'highlight', description: 'Iconische kasseienklim' },
        { pct: 0.15, name: 'Foto Spot Oudenaarde', type: 'photo', description: 'Panoramisch uitzicht over de stad' },
        { pct: 0.20, name: 'Steile Bocht', type: 'warning', description: 'Let op: scherpe bocht en steil' },
      ],
    },
    {
      title: 'Ardennen - Ourthe Vallei',
      startPct: 0.30,
      endPct: 0.50,
      highlights: [
        { pct: 0.35, name: 'Durbuy Centrum', type: 'highlight', description: 'Kleinste stad van België' },
        { pct: 0.40, name: 'Ourthe Vallei Uitzicht', type: 'photo', description: 'Spectaculair vallei panorama' },
        { pct: 0.42, name: 'Rivieroversteek', type: 'waypoint', description: 'Brug over de Ourthe' },
        { pct: 0.45, name: 'Smalle Weg', type: 'warning', description: 'Zeer smal wegdek' },
      ],
    },
    {
      title: 'Hoge Venen',
      startPct: 0.55,
      endPct: 0.75,
      highlights: [
        { pct: 0.58, name: 'Spa Circuit', type: 'highlight', description: 'Nabij het legendarische F1 circuit' },
        { pct: 0.62, name: 'Venen Panorama', type: 'photo', description: 'Uniek hoogveenlandschap' },
        { pct: 0.65, name: 'Eau Rouge', type: 'waypoint', description: 'Beroemde bocht nabij circuit' },
        { pct: 0.68, name: 'Signal de Botrange', type: 'highlight', description: 'Hoogste punt van België (694m)' },
        { pct: 0.70, name: 'Steile Afdaling', type: 'warning', description: 'Gevaarlijke afdaling bij nat weer' },
      ],
    },
    {
      title: 'Condroz',
      startPct: 0.80,
      endPct: 0.95,
      highlights: [
        { pct: 0.83, name: 'Dinant Citadel', type: 'highlight', description: 'Historische vesting met uitzicht' },
        { pct: 0.87, name: 'Maas Vallei', type: 'photo', description: 'Rivier en rotswanden' },
        { pct: 0.90, name: 'Gravelweg', type: 'warning', description: 'Onverhard wegdek - rijd voorzichtig' },
      ],
    },
  ];
  
  // Process each zone
  for (const segment of zoneSegments) {
    console.log(`\n📍 ${segment.title}`);
    
    // Get start and end points
    const startPoint = getPointAtPercentage(points, segment.startPct);
    const endPoint = getPointAtPercentage(points, segment.endPct);
    
    console.log(`   Start: ${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}`);
    console.log(`   End: ${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)}`);
    
    // Get highlight locations
    const locations = segment.highlights.map(h => {
      const point = getPointAtPercentage(points, h.pct);
      console.log(`   - ${h.name}: ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`);
      return {
        name: h.name,
        coordinates: point,
        type: h.type,
        description: h.description,
      };
    });
    
    // Find the zone document
    const zones = await client.fetch(
      `*[_type == "rallyZone" && title == $title]`,
      { title: segment.title }
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
          startPoint,
          endPoint,
        })
        .commit();
      console.log(`   ✅ Updated zone endpoints`);
    } catch (error) {
      console.log(`   ⚠️  Error updating zone:`, error);
    }
    
    // Update routeTips with locations
    if (zone.routeTips && zone.routeTips.length > 0) {
      // Add locations to the first routeTip
      const updatedRouteTips = [...zone.routeTips];
      updatedRouteTips[0] = {
        ...updatedRouteTips[0],
        locations,
      };
      
      try {
        await client
          .patch(docId)
          .set({
            routeTips: updatedRouteTips,
          })
          .commit();
        console.log(`   ✅ Updated routeTip locations (${locations.length} points)`);
      } catch (error) {
        console.log(`   ⚠️  Error updating routeTips:`, error);
      }
    }
  }
  
  console.log('\n✨ Done!');
}

generateZoneDataFromMainGpx().catch(console.error);
