import { readFileSync } from 'fs';
import { join } from 'path';

// Simple GPX parser to extract waypoints and route info
function parseGPX(gpxContent: string) {
  const waypointRegex = /<wpt lat="([^"]+)" lon="([^"]+)">/g;
  const waypoints: Array<{ lat: number; lon: number }> = [];
  
  let match;
  while ((match = waypointRegex.exec(gpxContent)) !== null) {
    waypoints.push({
      lat: parseFloat(match[1]),
      lon: parseFloat(match[2])
    });
  }
  
  return waypoints;
}

// Calculate distance between two coordinates in km (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Identify regions
function identifyRegion(lat: number, lon: number): string {
  // Belgian regions based on coordinates
  if (lat > 51.0) return 'West-Vlaanderen (Start)';
  if (lat > 50.85 && lon < 3.7) return 'Oost-Vlaanderen';
  if (lat > 50.7 && lat < 50.85 && lon < 4.0) return 'Zuid Oost-Vlaanderen';
  if (lat > 50.5 && lat < 50.7 && lon < 4.3) return 'Henegouwen';
  if (lat < 50.3 && lon < 4.7) return 'Namen/Samber';
  if (lat < 50.0 && lon > 4.7 && lon < 5.3) return 'Ardennen (Zuid)';
  if (lat < 50.0 && lon > 5.2) return 'Ardennen (Oost)';
  if (lat > 50.0 && lat < 50.3 && lon > 5.2) return 'Ardennen (Noord)';
  if (lat > 50.2 && lon > 5.5) return 'Luik/Limburg';
  return 'Onbekend gebied';
}

async function main() {
  const gpxPath = join(process.cwd(), '..', 'Deur den Bocht Rally.gpx');
  const gpxContent = readFileSync(gpxPath, 'utf-8');
  
  const waypoints = parseGPX(gpxContent);
  console.log(`📍 Totaal aantal waypoints: ${waypoints.length}\n`);
  
  // Calculate total distance
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistance += calculateDistance(
      waypoints[i].lat, waypoints[i].lon,
      waypoints[i + 1].lat, waypoints[i + 1].lon
    );
  }
  console.log(`🛣️  Totale afstand: ${Math.round(totalDistance)} km\n`);
  
  // Analyze route segments and suggest rally zones
  console.log('🗺️  ROUTE ANALYSE PER REGIO:\n');
  console.log('='.repeat(70));
  
  const segments: Array<{
    index: number;
    lat: number;
    lon: number;
    region: string;
    distanceFromStart: number;
  }> = [];
  
  let cumulativeDistance = 0;
  for (let i = 0; i < waypoints.length; i++) {
    if (i > 0) {
      cumulativeDistance += calculateDistance(
        waypoints[i-1].lat, waypoints[i-1].lon,
        waypoints[i].lat, waypoints[i].lon
      );
    }
    
    const region = identifyRegion(waypoints[i].lat, waypoints[i].lon);
    segments.push({
      index: i,
      lat: waypoints[i].lat,
      lon: waypoints[i].lon,
      region,
      distanceFromStart: cumulativeDistance
    });
  }
  
  // Group by region and find interesting points
  const regionChanges: typeof segments = [];
  let lastRegion = '';
  
  for (const segment of segments) {
    if (segment.region !== lastRegion) {
      regionChanges.push(segment);
      lastRegion = segment.region;
    }
  }
  
  console.log('\n📍 BELANGRIJKE PUNTEN LANGS DE ROUTE:\n');
  regionChanges.forEach((point, idx) => {
    console.log(`${idx + 1}. ${point.region}`);
    console.log(`   📍 Coördinaten: ${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}`);
    console.log(`   🛣️  Na ${Math.round(point.distanceFromStart)} km`);
    console.log(`   🔗 Google Maps: https://www.google.com/maps?q=${point.lat},${point.lon}`);
    console.log('');
  });
  
  // Suggest 8 rally zones based on interesting areas
  console.log('\n💡 VOORGESTELDE RALLY ZONES:\n');
  console.log('='.repeat(70));
  
  const suggestions = [
    {
      name: 'RZ1 - Leie Valley Loop',
      type: 'short',
      checkpoints: 1,
      km: '~15 km',
      location: 'Rond Deinze/Zulte',
      coords: { lat: 50.98, lon: 3.60 },
      description: 'Verlaat de hoofdroute langs de Leie. Volg kronkelende wegen door polders en velden naar een kleine brug.'
    },
    {
      name: 'RZ2 - Ronse Heuvelzone',
      type: 'medium',
      checkpoints: 2,
      km: '~22 km',
      location: 'Ronse omgeving',
      coords: { lat: 50.75, lon: 3.56 },
      description: 'Klimmen door de Vlaamse Ardennen. Eerste checkpoint bij een kapel, tweede op een heuvel met uitzicht.'
    },
    {
      name: 'RZ3 - Tussen Schelde en Dender',
      type: 'short',
      checkpoints: 1,
      km: '~8 km',
      location: 'Zottegem/Geraardsbergen',
      coords: { lat: 50.86, lon: 3.58 },
      description: 'Smalle landweggetjes tussen twee rivieren. Zoek een oude watermolen.'
    },
    {
      name: 'RZ4 - Pays des Collines',
      type: 'medium',
      checkpoints: 2,
      km: '~20 km',
      location: 'Frans-Vlaanderen grens',
      coords: { lat: 50.63, lon: 3.69 },
      description: 'Over de grens, door glooiend landschap. Checkpoint bij een Fort, tweede bij een uitzichtpunt.'
    },
    {
      name: 'RZ5 - Samber Valley Challenge',
      type: 'long',
      checkpoints: 3,
      km: '~38 km',
      location: 'Samber regio, Namen provincie',
      coords: { lat: 50.27, lon: 4.43 },
      description: 'Lange lus langs de Samber. 3 checkpoints: oude sluis, verlaten steengroeve, abdij ruïne.'
    },
    {
      name: 'RZ6 - Ardennen Panorama Route',
      type: 'long',
      checkpoints: 3,
      km: '~42 km',
      location: 'Houffalize/La Roche regio',
      coords: { lat: 50.10, lon: 5.45 },
      description: 'Diep de Ardennen in. Smalle bergwegen, dichte bossen. Checkpoints: radiomast, Barrage de Nisramont, hoogste punt.'
    },
    {
      name: 'RZ7 - Vallei van de Ourthe',
      type: 'medium',
      checkpoints: 2,
      km: '~24 km',
      location: 'La Roche/Houffalize',
      coords: { lat: 50.13, lon: 5.53 },
      description: 'Volg de Ourthe stroomopwaarts. Checkpoint bij een oude brug en bij een waterval.'
    },
    {
      name: 'RZ8 - Signal de Botrange Finale',
      type: 'short',
      checkpoints: 1,
      km: '~12 km',
      location: 'Hoge Venen, Luik',
      coords: { lat: 50.22, lon: 5.73 },
      description: 'De laatste klim naar het hoogste punt van België. Checkpoint bij de toren. Rechtstreeks naar finish.'
    }
  ];
  
  suggestions.forEach((zone, idx) => {
    console.log(`\n${zone.name}`);
    console.log(`Type: ${zone.type.toUpperCase()} (${zone.checkpoints} checkpoint${zone.checkpoints > 1 ? 's' : ''})`);
    console.log(`Lengte: ${zone.km}`);
    console.log(`Locatie: ${zone.location}`);
    console.log(`📍 ${zone.coords.lat}, ${zone.coords.lon}`);
    console.log(`🔗 https://www.google.com/maps?q=${zone.coords.lat},${zone.coords.lon}`);
    console.log(`Omschrijving: ${zone.description}`);
  });
  
  console.log('\n' + '='.repeat(70));
  console.log('\n💡 TIP: Gebruik Google Maps en Street View om deze locaties te verkennen');
  console.log('en specifieke checkpoints te bepalen (kapellen, bruggen, uitzichtpunten).\n');
}

main().catch(console.error);
