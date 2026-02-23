#!/usr/bin/env node
/*
  regenerate-rallyZones.js
  - Reads GPX track and POIs
  - For each intended zone (uses existing rallyZones.json titles/centers),
    computes start/end indices along GPX so start is before highlights
  - Picks highlights from POIs that fall between start..end and builds
    2 routeTips per zone with chronological locations and sensible challenges
  - Writes apps/web/app/rallyZones.json (canonical) for review
  - Does NOT directly upsert; caller can run delete + prepare-and-run afterwards
*/

const fs = require('fs');
const path = require('path');

function readGPXPoints(gpxPath) {
  const raw = fs.readFileSync(gpxPath, 'utf8');
  const re = /<trkpt[^>]*lat="([^\"]+)"[^>]*lon="([^\"]+)"[^>]*>/g;
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

function pickPOIsForZone(pois, trkpts, startIdx, endIdx) {
  // select POIs whose nearest track index is between start and end +/- buffer
  const out = [];
  for (const p of pois) {
    const point = p.mapLocation && p.mapLocation.pointLatLon ? { lat: p.mapLocation.pointLatLon[0], lng: p.mapLocation.pointLatLon[1] } : null;
    if (!point) continue;
    const idx = nearestIndexToPoint(point, trkpts);
    if (idx === null) continue;
    if (idx >= startIdx && idx <= endIdx) out.push(Object.assign({}, p, { _trkIdx: idx }));
  }
  out.sort((a, b) => a._trkIdx - b._trkIdx);
  return out;
}

function makeChallengeForPOI(poi) {
  const name = poi.mapLocation?.locationInfo?.customName || poi.mapLocation?.locationInfo?.poiName || 'locatie';
  const cat = (poi.mapLocation?.locationInfo?.poiCategory || '').toLowerCase();
  if (cat.includes('scenic') || /panoram/i.test(name)) return { type: 'photo', question: `Maak een foto van het uitzicht bij ${name}`, hint: 'Kies een panoramisch zicht', points: 5, isActive: true };
  if (cat.includes('restaurant') || /cafe|bar|restaurant/i.test(name)) return { type: 'text', question: `Noem een gerecht of kenmerk van ${name}`, hint: 'Kijk op het menu ter plekke', points: 5, isActive: true };
  if (cat.includes('castle') || /chateau|castle|kasteel/i.test(name)) return { type: 'photo', question: `Maak een foto van een opvallend detail van ${name}`, hint: 'Poorten/torens werken goed', points: 6, isActive: true };
  if (cat.includes('cave') || /grot|grotte/i.test(name)) return { type: 'photo', question: `Maak een foto bij de toegang van ${name}`, hint: 'Veilig blijven', points: 6, isActive: true };
  return { type: 'photo', question: `Maak een foto bij ${name}`, hint: 'Let op compositie', points: 5, isActive: true };
}

function generateRouteTips(zoneTitle, zoneStartPt, zoneEndPt, poisForZone, trkpts, zoneOrder) {
  // Create two routeTips: one 'technical' (focus on scenic/castle/highlights), and one 'panoramic/backroads'
  const techPois = poisForZone.filter(p => { const cat = (p.mapLocation?.locationInfo?.poiCategory||'').toLowerCase(); return /scenic|castle|amusement|geographic/.test(cat) || /chateau|castle|kasteel/i.test(p.mapLocation?.locationInfo?.customName||''); });
  const panoPois = poisForZone.filter(p => !techPois.includes(p));

  function buildTip(name, type, pickList, color) {
    const locations = [];
    // start location = zoneStartPt
    locations.push({ name: `${name} — Start`, coordinates: { lat: zoneStartPt.lat, lng: zoneStartPt.lng }, type: 'start', description: 'Startpunt', challenge: { type: 'text', question: `Schrijf kort waar jullie deze route starten bij ${zoneTitle}`, hint: '', options: [], correctAnswer: '', points: 1, isActive: true } });
    // pick up to 4 POIs in order
    const picks = pickList.slice(0, 4);
    for (const p of picks) {
      const nm = p.mapLocation?.locationInfo?.customName || p.mapLocation?.locationInfo?.poiName || 'POI';
      const coords = { lat: p.mapLocation.pointLatLon[0], lng: p.mapLocation.pointLatLon[1] };
      locations.push({ name: nm, coordinates: coords, type: 'highlight', description: p.mapLocation?.locationInfo?.formattedAddress || '', challenge: makeChallengeForPOI(p) });
    }
    // end location = zoneEndPt
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

  const zonesSeedPath = path.join(root, 'apps', 'web', 'app', 'rallyZones.json');
  const zoneSeeds = fs.existsSync(zonesSeedPath) ? JSON.parse(fs.readFileSync(zonesSeedPath, 'utf8')) : [];

  // Target number of zones. If the existing seeds are fewer than this,
  // synthesize seeds by splitting the GPX into equal segments so points are
  // closer together. User preferred 5 zones for denser points.
  const TARGET_ZONES = 5;
  let seedsToUse = [];
  if (zoneSeeds.length >= TARGET_ZONES) {
    seedsToUse = zoneSeeds.slice(0, TARGET_ZONES);
  } else if (zoneSeeds.length > 0 && zoneSeeds.length < TARGET_ZONES) {
    // use existing seeds and generate additional ones from GPX track
    seedsToUse = zoneSeeds.slice();
    const need = TARGET_ZONES - seedsToUse.length;
    const segLen = Math.floor(trkpts.length / TARGET_ZONES);
    for (let i = 0; i < need; i++) {
      const segIdx = (seedsToUse.length + i) * segLen + Math.floor(segLen / 2);
      const idx = Math.max(0, Math.min(trkpts.length - 1, segIdx));
      const pt = trkpts[idx];
      seedsToUse.push({ title: `Zone ${seedsToUse.length + 1}`, center: { lat: pt.lat, lon: pt.lng } });
    }
  } else {
    // no seeds: create TARGET_ZONES seeds evenly across the GPX
    seedsToUse = [];
    const segLen = Math.floor(trkpts.length / TARGET_ZONES);
    for (let i = 0; i < TARGET_ZONES; i++) {
      const mid = Math.min(trkpts.length - 1, Math.floor((i + 0.5) * segLen));
      const pt = trkpts[mid] || trkpts[Math.min(mid, trkpts.length - 1)];
      seedsToUse.push({ title: `Zone ${i + 1}`, center: { lat: pt.lat, lon: pt.lng } });
    }
  }

  const outZones = [];
  let order = 0;
  for (const seed of seedsToUse) {
    order += 1;
    // find POIs near seed.center (radius 30km) and derive their trk indices
    const center = seed.center || seed.startPoint || { lat: 0, lon: 0 };
    const centerPt = { lat: center.lat, lng: center.lon };
    // compute nearest POI trk indices for POIs within 30 km of center
    const nearby = [];
    for (const p of pois) {
      const point = p.mapLocation && p.mapLocation.pointLatLon ? { lat: p.mapLocation.pointLatLon[0], lng: p.mapLocation.pointLatLon[1] } : null;
      if (!point) continue;
      const d = haversineKm(centerPt, point);
      if (d <= 30) {
        const idx = nearestIndexToPoint(point, trkpts);
        nearby.push(Object.assign({}, p, { _trkIdx: idx }));
      }
    }
    nearby.sort((a, b) => a._trkIdx - b._trkIdx);

    // Determine start/end indices: prefer seed.indexRange if present
    let sIdx = seed.indexRange && Number.isFinite(seed.indexRange[0]) ? seed.indexRange[0] : (nearby.length ? Math.max(0, nearby[0]._trkIdx - 20) : 0);
    let eIdx = seed.indexRange && Number.isFinite(seed.indexRange[1]) ? seed.indexRange[1] : (nearby.length ? Math.min(trkpts.length - 1, nearby[nearby.length - 1]._trkIdx + 8) : Math.min(trkpts.length - 1, sIdx + 2000));

    // ensure start is before first nearby highlight
    if (nearby.length) {
      const firstIdx = nearby[0]._trkIdx;
      if (sIdx > firstIdx) sIdx = Math.max(0, firstIdx - 5);
      const lastIdx = nearby[nearby.length - 1]._trkIdx;
      // choose a small buffer after last highlight so end is close
      if (eIdx < lastIdx + 2) eIdx = Math.min(trkpts.length - 1, lastIdx + 2);
    }

    const startPt = trkpts[sIdx];
    let endPt = trkpts[eIdx];
    // If the computed endPt is far (>1km) from the last highlight, snap the endPt to that highlight's coordinates
    if (nearby.length) {
      const lastPoi = nearby[nearby.length - 1];
      const lastPoiPt = { lat: lastPoi.mapLocation.pointLatLon[0], lng: lastPoi.mapLocation.pointLatLon[1] };
      const distToLast = endPt ? haversineKm(endPt, lastPoiPt) : Infinity;
      if (!endPt || distToLast > 1.0) {
        endPt = lastPoiPt;
        // also set eIdx to the poi's trk index if available
        if (Number.isFinite(lastPoi._trkIdx)) eIdx = lastPoi._trkIdx;
      }
    }

    // collect POIs whose trk index is in [sIdx,eIdx]
    const poisForZone = pickPOIsForZone(pois, trkpts, sIdx, eIdx);

    // build two routeTips per zone
    const routeTips = generateRouteTips(seed.title || `Zone ${order}`, startPt, endPt, poisForZone, trkpts, order);

    // pick a representative POI id for better placeholder naming
    const repPoi = poisForZone && poisForZone.length ? poisForZone[0] : null;
    const repId = repPoi ? (repPoi.id || repPoi._id || 'poi') : 'seed';

    const doc = {
      _id: seed._id || `rallyZone-${order}`,
      title: seed.title || `Rally Zone ${order}`,
      description: seed.description || '',
      location: seed.location || '',
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
      // hazepad / skipRoute: optional alternative GPX to skip this zone
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
