const fs = require('fs');
const path = require('path');

function haversine(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon), Math.sqrt(1 - (sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon)));
  return R * c;
}

function extractTrkpts(gpx) {
  const re = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g;
  const pts = [];
  let m;
  while ((m = re.exec(gpx)) !== null) {
    pts.push({ lat: parseFloat(m[1]), lon: parseFloat(m[2]) });
  }
  return pts;
}

function loadPOIs(p) {
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw).map((poi) => ({
    id: poi.id,
    name: (poi.mapLocation && poi.mapLocation.locationInfo && (poi.mapLocation.locationInfo.customName || poi.mapLocation.locationInfo.poiName)) || null,
    category: (poi.mapLocation && poi.mapLocation.locationInfo && poi.mapLocation.locationInfo.poiCategory) || null,
    lat: poi.mapLocation && poi.mapLocation.pointLatLon && poi.mapLocation.pointLatLon[0],
    lon: poi.mapLocation && poi.mapLocation.pointLatLon && poi.mapLocation.pointLatLon[1],
    raw: poi,
  })).filter(p=>p.lat && p.lon);
}

function cumulativeDistances(route) {
  const d = [0];
  for (let i = 1; i < route.length; i++) {
    d.push(d[i-1] + haversine(route[i-1], route[i]));
  }
  return d;
}

function nearestRouteIndex(route, poi) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < route.length; i++) {
    const dist = haversine(route[i], poi);
    if (dist < bestDist) { bestDist = dist; best = i; }
  }
  return {index: best, dist: bestDist};
}

function makeTips(zone, highlights) {
  const climbs = ['Koppenberg','Oude Kwaremont','Paterberg','Taaienberg','Leberg','Molenberg','Berendries','Eikenberg'];
  const names = highlights.map(h=>h.name).filter(Boolean);
  const tips = [];
  // tip about climbs if present
  const foundClimbs = names.filter(n => climbs.some(c=> n && n.toLowerCase().includes(c.toLowerCase())));
  if (foundClimbs.length) {
    tips.push(`Let op: steile beklimmingen rond ${foundClimbs.slice(0,3).join(', ')}.`);
  }
  // scenic tip
  if (names.length) {
    tips.push(`Highlights: ${names.slice(0,3).join(', ')}.`);
  }
  // safety / logistics tip
  tips.push('Tip: let op op smalle wegen en volg de route aanwijzingen.');
  // ensure 3 tips
  return tips.slice(0,3);
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const poisPath = path.join(repoRoot, 'apps', 'web', 'app', 'POIs.json');
  const gpxPath = path.join(repoRoot, 'apps', 'web', 'Deur den Bocht Rally.gpx');

  const pois = loadPOIs(poisPath);
  const gpx = fs.readFileSync(gpxPath, 'utf8');
  const route = extractTrkpts(gpx);
  if (!route.length) { console.error('No route points found'); process.exit(1); }

  const cum = cumulativeDistances(route);
  const total = cum[cum.length-1];
  const cutPoints = [total*0.25, total*0.5, total*0.75];

  const cutsIdx = cutPoints.map(cp => {
    for (let i=0;i<cum.length;i++) if (cum[i]>=cp) return i;
    return cum.length-1;
  });
  const zones = [];
  let startIdx = 0;
  for (let z=0; z<4; z++) {
    const endIdx = (z<3)? cutsIdx[z] : route.length-1;
    const segPts = route.slice(startIdx, endIdx+1);
    const centerIdx = startIdx + Math.floor(segPts.length/2);
    const center = route[centerIdx];
    zones.push({ id: `zone-${z+1}`, indexRange: [startIdx,endIdx], center });
    startIdx = endIdx+1;
  }

  // assign POIs to nearest zone
  for (const poi of pois) {
    const {index} = nearestRouteIndex(route, {lat: poi.lat, lon: poi.lon});
    const zoneIndex = zones.findIndex(z => index >= z.indexRange[0] && index <= z.indexRange[1]);
    const assigned = zoneIndex >=0 ? zoneIndex : (index < zones[0].indexRange[0] ? 0 : zones.length-1);
    if (!zones[assigned].pois) zones[assigned].pois = [];
    const nr = nearestRouteIndex(route, {lat: poi.lat, lon: poi.lon});
    zones[assigned].pois.push(Object.assign({}, poi, { distanceKm: nr.dist }));
  }

  // sort POIs by distance and pick highlights, prepare tips
  const outputZones = zones.map((z, i) => {
    const sorted = (z.pois||[]).sort((a,b)=>a.distanceKm - b.distanceKm);
    const highlights = sorted.slice(0,6);
    const tips = makeTips(z, highlights);
    return {
      _id: `rallyZone-${i+1}`,
      title: `Rally Zone ${i+1}`,
      center: z.center,
      routeTip: tips,
      highlights: highlights.map(h=>({ id: h.id, name: h.name, category: h.category, lat: h.lat, lon: h.lon, distanceKm: Number(h.distanceKm.toFixed(3)) })),
      poiCount: (z.pois||[]).length,
      indexRange: z.indexRange
    };
  });

  const outPath = path.join(repoRoot, 'apps', 'web', 'app', 'rallyZones.json');
  fs.writeFileSync(outPath, JSON.stringify(outputZones, null, 2), 'utf8');
  console.log('Wrote', outPath);

  // prepare sanity payload (create or patch)
  const sanityPayload = outputZones.map(z => ({
    _type: 'rallyZone',
    _id: z._id,
    title: z.title,
    center: { _type: 'geopoint', lat: z.center.lat, lng: z.center.lon },
    routeTip: z.routeTip,
    highlights: z.highlights.map(h=>({ _type: 'reference', _ref: h.id }))
  }));
  const payloadPath = path.join(repoRoot, 'scripts', 'sanity-payload.json');
  fs.writeFileSync(payloadPath, JSON.stringify(sanityPayload, null, 2), 'utf8');
  console.log('Prepared Sanity payload at', payloadPath);
}

main();
