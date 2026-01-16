import * as fs from 'fs';

// Read the GPX file
const gpxPath = '/Users/thomasseyssens/Desktop/Deur Den Bocht/2026/Deur den Bocht Rally.gpx';
const gpxContent = fs.readFileSync(gpxPath, 'utf-8');

// Extract waypoints
const waypoints: Array<{ lat: number; lon: number; index: number }> = [];
const waypointRegex = /<wpt lat="([^"]+)" lon="([^"]+)">/g;
let match;
let index = 0;

while ((match = waypointRegex.exec(gpxContent)) !== null) {
  waypoints.push({
    lat: parseFloat(match[1]),
    lon: parseFloat(match[2]),
    index: index++
  });
}

console.log(`\n📍 Total waypoints found: ${waypoints.length}\n`);

// Haversine formula to calculate distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate cumulative distances
let cumulativeDistance = 0;
const waypointsWithDistance = waypoints.map((wp, i) => {
  if (i > 0) {
    const dist = calculateDistance(
      waypoints[i - 1].lat,
      waypoints[i - 1].lon,
      wp.lat,
      wp.lon
    );
    cumulativeDistance += dist;
  }
  return {
    ...wp,
    cumulativeKm: cumulativeDistance
  };
});

console.log('Route progress:');
console.log(`Start: ${waypoints[0].lat}, ${waypoints[0].lon}`);
console.log(`End: ${waypoints[waypoints.length - 1].lat}, ${waypoints[waypoints.length - 1].lon}`);
console.log(`Total distance: ${cumulativeDistance.toFixed(2)} km\n`);

// Define zones based on actual route progression
// Short zones: ~15km apart, Medium: ~25km, Long: ~40km

const zones = [
  {
    name: 'RZ1: Leie Valley Loop',
    type: 'short',
    startKm: 20,  // Exit point
    endKm: 35,    // Rejoin point
    checkpointKm: 27.5  // Middle of loop
  },
  {
    name: 'RZ2: Ronse Heuvelzone', 
    type: 'medium',
    startKm: 60,
    endKm: 85,
    checkpointKm: [67, 78]  // Two checkpoints
  },
  {
    name: 'RZ3: Tussen Schelde en Dender',
    type: 'short',
    startKm: 105,
    endKm: 118,
    checkpointKm: 111.5
  },
  {
    name: 'RZ4: Pays des Collines',
    type: 'medium',
    startKm: 140,
    endKm: 165,
    checkpointKm: [147, 158]
  },
  {
    name: 'RZ5: Samber Valley Challenge',
    type: 'long',
    startKm: 190,
    endKm: 235,
    checkpointKm: [200, 215, 227]  // Three checkpoints
  },
  {
    name: 'RZ6: Ardennen Panorama Route',
    type: 'long',
    startKm: 260,
    endKm: 305,
    checkpointKm: [272, 285, 298]
  },
  {
    name: 'RZ7: Vallei van de Ourthe',
    type: 'medium',
    startKm: 320,
    endKm: 345,
    checkpointKm: [328, 338]
  },
  {
    name: 'RZ8: Signal de Botrange Finale',
    type: 'short',
    startKm: 350,
    endKm: 361,
    checkpointKm: 356
  }
];

function findNearestWaypoint(targetKm: number): typeof waypoints[0] {
  return waypointsWithDistance.reduce((prev, curr) => 
    Math.abs(curr.cumulativeKm - targetKm) < Math.abs(prev.cumulativeKm - targetKm) ? curr : prev
  );
}

console.log('\n🗺️  PROPOSED RALLY ZONES (based on actual route):\n');

zones.forEach((zone) => {
  const start = findNearestWaypoint(zone.startKm);
  const end = findNearestWaypoint(zone.endKm);
  
  console.log(`\n${zone.name} (${zone.type})`);
  console.log(`  Start (km ${zone.startKm}): ${start.lat.toFixed(5)}, ${start.lon.toFixed(5)} [waypoint ${start.index}]`);
  console.log(`  End (km ${zone.endKm}): ${end.lat.toFixed(5)}, ${end.lon.toFixed(5)} [waypoint ${end.index}]`);
  console.log(`  Distance between: ${calculateDistance(start.lat, start.lon, end.lat, end.lon).toFixed(2)} km`);
  
  if (Array.isArray(zone.checkpointKm)) {
    zone.checkpointKm.forEach((cpKm, i) => {
      const cp = findNearestWaypoint(cpKm);
      console.log(`  Checkpoint ${i + 1} (km ${cpKm}): ${cp.lat.toFixed(5)}, ${cp.lon.toFixed(5)} [waypoint ${cp.index}]`);
    });
  } else {
    const cp = findNearestWaypoint(zone.checkpointKm);
    console.log(`  Checkpoint (km ${zone.checkpointKm}): ${cp.lat.toFixed(5)}, ${cp.lon.toFixed(5)} [waypoint ${cp.index}]`);
  }
  
  console.log(`  Google Maps: https://www.google.com/maps?q=${start.lat},${start.lon}`);
});

console.log('\n✅ Analysis complete!\n');
