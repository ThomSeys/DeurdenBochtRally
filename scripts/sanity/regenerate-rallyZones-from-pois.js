#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function readGPXPoints(gpxPath) {
  const raw = fs.readFileSync(gpxPath, 'utf8');
  const re = /<trkpt[^>]*lat="([^"]+)"[^>]*lon="([^"]+)"[^>]*>/g;
  const pts = [];
  let m;
  while ((m = re.exec(raw)) !== null) pts.push({ lat: parseFloat(m[1]), lng: parseFloat(m[2]) });
  return pts;
}

function haversineKm(a, b) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aHarv = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1 - aHarv));
  return R * c;
}

function nearestIndexToPoint(point, trkpts) {
  if (!point || trkpts.length === 0) return null;
  let bestIdx = 0; let best = Infinity;
  for (let i = 0; i < trkpts.length; i++) {
    const d = haversineKm(point, trkpts[i]);
    if (d < best) { best = d; bestIdx = i; }
  }
  return bestIdx;
}

function pickPOIsForZone(pois, trkpts, sIdx, eIdx) {
  const out = [];
  for (const p of pois) {
    const point = p.mapLocation && p.mapLocation.pointLatLon ? { lat: p.mapLocation.pointLatLon[0], lng: p.mapLocation.pointLatLon[1] } : null;
    if (!point) continue;
    const idx = nearestIndexToPoint(point, trkpts);
    if (idx === null) continue;
    if (idx >= sIdx && idx <= eIdx) out.push(Object.assign({}, p, { _trkIdx: idx }));
  }
  out.sort((a, b) => a._trkIdx - b._trkIdx);
  return out;
}

function makeChallengeForPOI(poi) {
  const name = poi.mapLocation?.locationInfo?.customName || poi.mapLocation?.locationInfo?.poiName || 'locatie';
  const cat = (poi.mapLocation?.locationInfo?.poiCategory || '').toLowerCase();
  if (cat.includes('scenic') || /panoram/i.test(name)) return { type: 'photo', question: `Maak een foto van het uitzicht bij ${name}`, hint: 'Kies een panoramisch zicht', points: 5, isActive: true };
  if (cat.includes('restaurant') || /cafe|bar|restaurant/i.test(name)) return { type: 'text', question: `Noem een gerecht of kenmerk van ${name}`, hint: 'Kijk op het menu ter plekke', points: 5, isActive: true };
  return { type: 'photo', question: `Maak een foto bij ${name}`, hint: 'Let op compositie', points: 5, isActive: true };
}

function generateRouteTips(zoneTitle, zoneStartPt, zoneEndPt, poisForZone, trkpts, zoneOrder) {
  const techPois = poisForZone.filter(p => { const cat = (p.mapLocation?.locationInfo?.poiCategory||'').toLowerCase(); return /scenic|castle|amusement|geographic/.test(cat) || /chateau|castle|kasteel/i.test(p.mapLocation?.locationInfo?.customName||''); });
  const panoPois = poisForZone.filter(p => !techPois.includes(p));

  function buildTip(name, type, pickList, color) {
    const locations = [];
    locations.push({ name: `${name} — Start`, coordinates: { lat: zoneStartPt.lat, lng: zoneStartPt.lng }, type: 'start', description: 'Startpunt', challenge: { type: 'text', question: `Schrijf kort waar jullie deze route starten bij ${zoneTitle}`, hint: '', options: [], correctAnswer: '', points: 1, isActive: true } });
    const picks = pickList.slice(0, 4);
    for (const p of picks) {
      const nm = p.mapLocation?.locationInfo?.customName || p.mapLocation?.locationInfo?.poiName || 'POI';
      const coords = { lat: p.mapLocation.pointLatLon[0], lng: p.mapLocation.pointLatLon[1] };
      locations.push({ name: nm, coordinates: coords, type: 'highlight', description: p.mapLocation?.locationInfo?.formattedAddress || '', challenge: makeChallengeForPOI(p) });
    }
    locations.push({ name: `${name} — Eind`, coordinates: { lat: zoneEndPt.lat, lng: zoneEndPt.lng }, type: 'end', description: 'Eindpunt (rejoin GPX)', challenge: { type: 'text', question: 'Hebben jullie de route voltooid?', hint: '', options: [], correctAnswer: '', points: 1, isActive: true } });

    return {
      _type: 'routeTip',
      name,
      description: `${type === 'technical' ? 'Technische' : 'Panoramische'} optie met highlights in de zone.`,
      routeType: type === 'technical' ? 'technical' : 'panoramic',
      difficulty: type === 'technical' ? 'hard' : 'medium',
      estimatedDistance: 30 + zoneOrder * 2,
      character: type === 'technical' ? 'Steile stukken, technische secties' : 'Panoramisch, rustig',
      warnings: type === 'technical' ? 'Let op kasseien en smalle wegen' : 'Landwegjes en landbouwverkeer mogelijk',
      highlights: picks.map(p => p.mapLocation?.locationInfo?.customName || p.mapLocation?.locationInfo?.poiName || '').join('; '),
      exitInstructions: 'Volg de bewegwijzering vanaf het startpunt.',
      routeInstructions: 'Volg de aangegeven route en stop bij highlights.',
      rejoinInstructions: 'Voeg weer in op de hoofdroute bij het eindpunt.',
      gpxFile: { _type: 'file', asset: { _type: 'reference', _ref: `gpx-tip-placeholder-${zoneOrder}-${type === 'technical' ? 't' : 'p'}` } },
      color: color,
      locations,
    };
  }

  const tip1 = buildTip(`${zoneTitle} — Technisch`, 'technical', techPois.length ? techPois : poisForZone, '#D35400');
  const tip2 = buildTip(`${zoneTitle} — Panoramisch`, 'panoramic', panoPois.length ? panoPois : poisForZone.slice(4), '#1E8449');
  return [tip1, tip2];
}

async function main() {
  const root = path.resolve(__dirname, '..', '..');
  const gpxPath = path.join(root, 'apps', 'web', 'Deur den Bocht Rally.gpx');
  if (!fs.existsSync(gpxPath)) { console.error('GPX not found:', gpxPath); process.exit(1); }
  const trkpts = readGPXPoints(gpxPath);
  if (!trkpts.length) { console.error('No GPX trackpoints parsed'); process.exit(1); }

  const poisPath = path.join(root, 'apps', 'web', 'app', 'POIs.json');
  const pois = fs.existsSync(poisPath) ? JSON.parse(fs.readFileSync(poisPath, 'utf8')) : [];

  // find RZ POIs and group them by index (RZ-1, RZ-2, ...)
  const rzMap = new Map();
  const rzRe = /RZ-(\d+)\s*(start|eind|end)/i;
  for (const p of pois) {
    const name = p.mapLocation?.locationInfo?.customName || '';
    const m = name.match(rzRe);
    if (!m) continue;
    const idx = m[1];
    const kind = (m[2] || '').toLowerCase();
    if (!rzMap.has(idx)) rzMap.set(idx, {});
    const group = rzMap.get(idx);
    if (kind.startsWith('start')) group.start = p; else group.end = p;
  }

  const seeds = [];
  for (const [k, grp] of rzMap.entries()) {
    if (!grp.start || !grp.end) {
      console.warn('Skipping RZ', k, 'missing start or end POI');
      continue;
    }
    const sPt = { lat: grp.start.mapLocation.pointLatLon[0], lng: grp.start.mapLocation.pointLatLon[1] };
    const ePt = { lat: grp.end.mapLocation.pointLatLon[0], lng: grp.end.mapLocation.pointLatLon[1] };
    const sIdx = nearestIndexToPoint(sPt, trkpts);
    const eIdx = nearestIndexToPoint(ePt, trkpts);
    if (sIdx === null || eIdx === null) { console.warn('Could not map RZ', k, 'to track indices'); continue; }
    const s = Math.min(sIdx, eIdx);
    const e = Math.max(sIdx, eIdx);
    seeds.push({ title: `RZ-${k}`, indexRange: [s, e], _id: `rallyZone-rz-${k}`, center: { lat: trkpts[Math.floor((s + e) / 2)].lat, lon: trkpts[Math.floor((s + e) / 2)].lng } });
  }

  // sort seeds by start index along GPX
  seeds.sort((a, b) => a.indexRange[0] - b.indexRange[0]);

  if (!seeds.length) {
    console.error('No RZ seeds found in POIs. Aborting.');
    process.exit(1);
  }

  const outZones = [];
  let order = 0;
  for (const seed of seeds) {
    order += 1;
    const [sIdx, eIdx] = seed.indexRange;
    const startPt = trkpts[sIdx];
    const endPt = trkpts[eIdx];
    const poisForZone = pickPOIsForZone(pois, trkpts, sIdx, eIdx);
    const routeTips = generateRouteTips(seed.title || `Zone ${order}`, startPt, endPt, poisForZone, trkpts, order);
    const repPoi = poisForZone && poisForZone.length ? poisForZone[0] : null;
    const repId = repPoi ? (repPoi.id || repPoi._id || 'poi') : 'seed';

    const doc = {
      _id: seed._id || `rallyZone-${order}`,
      title: seed.title || `Rally Zone ${order}`,
      description: seed.description || '',
      center: seed.center || { lat: startPt.lat, lon: startPt.lng },
      routeTips,
      highlights: (poisForZone.slice(0,6).map(p => ({ id: p.id || (p._id||''), name: p.mapLocation?.locationInfo?.customName || p.mapLocation?.locationInfo?.poiName || '', lat: p.mapLocation.pointLatLon[0], lon: p.mapLocation.pointLatLon[1] }))),
      poiCount: poisForZone.length,
      indexRange: [sIdx, eIdx],
      color: seed.color || '#D35400',
      radius_m: seed.radius_m || 120,
      is_open: typeof seed.is_open === 'boolean' ? seed.is_open : true,
      startPoint: { lat: startPt.lat, lng: startPt.lng },
      endPoint: { lat: endPt.lat, lng: endPt.lng },
      order,
      image: seed.image || { _type: 'image', asset: { _type: 'reference', _ref: `image-placeholder-${order}-${repId}` } },
      reference_photo: seed.reference_photo || { _type: 'image', asset: { _type: 'reference', _ref: `reference-photo-placeholder-${order}-${repId}` } },
      gpxRoute: seed.gpxRoute || { _type: 'file', asset: { _type: 'reference', _ref: `gpx-placeholder-${order}-${repId}` } },
      skipRoute: seed.skipRoute || {
        instructions: 'Gebruik dit hazepad wanneer de zone afgesloten is. Volg de alternatieve GPX voor een veilige omleiding.',
        gpxFile: { _type: 'file', asset: { _type: 'reference', _ref: `skip-gpx-placeholder-${order}-${repId}` } },
        startPoint: { lat: startPt.lat, lng: startPt.lng },
        endPoint: { lat: endPt.lat, lng: endPt.lng },
      },
      edition: seed.edition || { _type: 'reference', _ref: 'edition-2026' },
    };
    outZones.push(doc);
  }

  const outPath = path.join(root, 'apps', 'web', 'app', 'rallyZones.json');
  fs.writeFileSync(outPath, JSON.stringify(outZones, null, 2), 'utf8');
  console.log('Wrote', outZones.length, 'rallyZones to', outPath);
}

main().catch(err => { console.error(err && err.message ? err.message : err); process.exit(1); });
