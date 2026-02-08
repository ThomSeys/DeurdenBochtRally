import fs from 'fs';
import path from 'path';

interface Checkpoint {
  _key: string;
  name: string;
  location: { lat: number; lng: number };
}

interface RallyZone {
  order: number;
  title: string;
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number; lng: number };
  checkpoints: Checkpoint[];
}

const zones: RallyZone[] = [
  {
    order: 1,
    title: 'Leie Valley Loop',
    startPoint: { lat: 51.01308, lng: 3.61875 },
    endPoint: { lat: 50.88479, lng: 3.58042 },
    checkpoints: [
      { _key: 'rz1-cp1', name: 'Checkpoint 1: De Brugwachter', location: { lat: 50.96918, lng: 3.62395 } }
    ]
  },
  {
    order: 2,
    title: 'Ronse Heuvelzone',
    startPoint: { lat: 50.72486, lng: 3.68384 },
    endPoint: { lat: 50.58285, lng: 3.80251 },
    checkpoints: [
      { _key: 'rz2-cp1', name: 'Checkpoint 1: Onze-Lieve-Vrouwkapel', location: { lat: 50.69229, lng: 3.67474 } },
      { _key: 'rz2-cp2', name: 'Checkpoint 2: Muziekberg Panorama', location: { lat: 50.7583, lng: 3.6178 } }
    ]
  },
  {
    order: 3,
    title: 'Tussen Schelde en Dender',
    startPoint: { lat: 50.60471, lng: 4.20145 },
    endPoint: { lat: 50.56327, lng: 4.23794 },
    checkpoints: [
      { _key: 'rz3-cp1', name: 'Checkpoint 1: Den Herdermolen', location: { lat: 50.60471, lng: 4.20145 } }
    ]
  },
  {
    order: 4,
    title: 'Pays des Collines',
    startPoint: { lat: 50.42103, lng: 4.28173 },
    endPoint: { lat: 50.22224, lng: 4.41212 },
    checkpoints: [
      { _key: 'rz4-cp1', name: 'Checkpoint 1: Fort du Vert Gazon', location: { lat: 50.34245, lng: 4.35235 } },
      { _key: 'rz4-cp2', name: 'Checkpoint 2: Mont de l\'Enclus', location: { lat: 50.27166, lng: 4.43370 } }
    ]
  },
  {
    order: 5,
    title: 'Samber Valley Challenge',
    startPoint: { lat: 50.10595, lng: 4.66004 },
    endPoint: { lat: 49.87992, lng: 4.90400 },
    checkpoints: [
      { _key: 'rz5-cp1', name: 'Checkpoint 1: Ascenseur de Strépy-Thieu', location: { lat: 50.4778, lng: 4.1572 } },
      { _key: 'rz5-cp2', name: 'Checkpoint 2: Carrière de Feluy', location: { lat: 50.5789, lng: 4.2645 } },
      { _key: 'rz5-cp3', name: 'Checkpoint 3: Abbaye d\'Aulne', location: { lat: 50.3535, lng: 4.3912 } }
    ]
  },
  {
    order: 6,
    title: 'Ardennen Panorama Route',
    startPoint: { lat: 49.78753, lng: 5.17524 },
    endPoint: { lat: 50.13412, lng: 5.28853 },
    checkpoints: [
      { _key: 'rz6-cp1', name: 'Checkpoint 1: Barrage de Nisramont', location: { lat: 50.1389, lng: 5.5558 } },
      { _key: 'rz6-cp2', name: 'Checkpoint 2: Roche à Frêne Viewpoint', location: { lat: 50.1234, lng: 5.4567 } },
      { _key: 'rz6-cp3', name: 'Checkpoint 3: Mont des Deux Provinces', location: { lat: 50.2123, lng: 5.5012 } }
    ]
  },
  {
    order: 7,
    title: 'Vallei van de Ourthe',
    startPoint: { lat: 50.13375, lng: 5.53609 },
    endPoint: { lat: 50.12837, lng: 5.78650 },
    checkpoints: [
      { _key: 'rz7-cp1', name: 'Checkpoint 1: Pont de Bérismenil', location: { lat: 50.09037, lng: 5.56763 } },
      { _key: 'rz7-cp2', name: 'Checkpoint 2: Cascade du Bayehon', location: { lat: 50.4956, lng: 6.1167 } }
    ]
  },
  {
    order: 8,
    title: 'Signal de Botrange Finale',
    startPoint: { lat: 50.15690, lng: 5.73486 },
    endPoint: { lat: 50.24155, lng: 5.75070 },
    checkpoints: [
      { _key: 'rz8-cp1', name: 'Checkpoint 1: Hoogste Punt van België', location: { lat: 50.5031, lng: 6.1089 } }
    ]
  }
];

function generateGPX(zone: RallyZone): string {
  const timestamp = new Date().toISOString();
  
  // Build waypoints
  const waypoints = [
    { name: 'Start', lat: zone.startPoint.lat, lng: zone.startPoint.lng },
    ...zone.checkpoints.map(cp => ({ name: cp.name, lat: cp.location.lat, lng: cp.location.lng })),
    { name: 'End', lat: zone.endPoint.lat, lng: zone.endPoint.lng }
  ];

  // Build track points (in order: start -> checkpoints -> end)
  const trackPoints = waypoints.map(wp => 
    `        <trkpt lat="${wp.lat}" lon="${wp.lng}">
          <name>${wp.name}</name>
          <time>${timestamp}</time>
        </trkpt>`
  ).join('\n');

  // Build waypoint markers
  const waypointMarkers = waypoints.map(wp =>
    `  <wpt lat="${wp.lat}" lon="${wp.lng}">
    <name>${wp.name}</name>
    <desc>${wp.name}</desc>
    <time>${timestamp}</time>
  </wpt>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Deur den Bocht Rally" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>RZ${zone.order} - ${zone.title}</name>
    <desc>Rally Zone ${zone.order}: ${zone.title}</desc>
    <time>${timestamp}</time>
  </metadata>
${waypointMarkers}
  <trk>
    <name>RZ${zone.order} - ${zone.title}</name>
    <desc>Rally detour route with ${zone.checkpoints.length} checkpoint(s)</desc>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
}

// Create output directory
const outputDir = path.join(process.cwd(), 'apps', 'web', 'public', 'gpx', 'zones');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('📍 Generating GPX files for rally zones...\n');

zones.forEach(zone => {
  const gpxContent = generateGPX(zone);
  const filename = `rz${zone.order}-${zone.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.gpx`;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, gpxContent);
  console.log(`✅ Created: ${filename}`);
});

console.log(`\n✨ All GPX files created in: ${outputDir}`);
console.log('\n📝 Files generated:');
zones.forEach(zone => {
  console.log(`   - RZ${zone.order}: ${zone.title} (${zone.checkpoints.length} checkpoint${zone.checkpoints.length > 1 ? 's' : ''})`);
});
