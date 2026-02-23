#!/usr/bin/env node
/*
  prepare-and-run.js
  - Reads .env.vercel to get Sanity credentials
  - Loads scripts/sanity-payload.json (generated zones)
  - Loads POIs.json to embed POI details into routeTips.locations
  - Transforms each zone into a schema-compliant `rallyZone` document
  - Upserts documents into Sanity using @sanity/client
*/

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

async function main() {
  const root = path.resolve(__dirname, '..', '..');
  const envPath = path.join(root, '.env.vercel');
  if (!fs.existsSync(envPath)) {
    console.error('.env.vercel not found at', envPath);
    process.exit(1);
  }
  const env = parseDotEnv(envPath);
  const SANITY_TOKEN = env.SANITY_TOKEN;
  const SANITY_PROJECT_ID = env.SANITY_PROJECT_ID || 'tp2nrvnd';
  const SANITY_DATASET = env.SANITY_DATASET || 'production';

  if (!SANITY_TOKEN) {
    console.error('SANITY_TOKEN not found in .env.vercel');
    process.exit(1);
  }

  const payloadPath = path.join(root, 'scripts', 'sanity-payload.json');
  if (!fs.existsSync(payloadPath)) {
    console.error('Payload not found:', payloadPath);
    process.exit(1);
  }
  const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));

  const poisPath = path.join(root, 'apps', 'web', 'app', 'POIs.json');
  const pois = fs.existsSync(poisPath) ? JSON.parse(fs.readFileSync(poisPath, 'utf8')) : [];
  const poiById = new Map(pois.map(p => [p.id, p]));

  // load the generated rallyZones.json to get indexRange values
  const zonesJsonPath = path.join(root, 'apps', 'web', 'app', 'rallyZones.json');
  const zonesJson = fs.existsSync(zonesJsonPath) ? JSON.parse(fs.readFileSync(zonesJsonPath, 'utf8')) : [];
  const zonesJsonById = new Map(zonesJson.map(z => [z._id || z.id, z]));

  // Merge payload entries with canonical `rallyZones.json` entries where
  // available. This produces `workPayload` which is used for document
  // generation below. Behavior:
  // - If `scripts/sanity-payload.json` is empty, fall back to `rallyZones.json`.
  // - For matching IDs, prefer explicit payload fields but copy any missing
  //   fields from the canonical zones JSON.
  function mergeZoneObjects(zj = {}, pz = {}) {
    const out = Object.assign({}, zj);
    // overlay payload fields
    Object.assign(out, pz);
    // normalize singular `routeTip` -> `routeTips`
    if (!out.routeTips && Array.isArray(out.routeTip)) out.routeTips = out.routeTip;
    return out;
  }

  let workPayload = [];
  if (!Array.isArray(payload) || payload.length === 0) {
    workPayload = zonesJson.slice();
  } else {
    workPayload = payload.map((pz) => {
      const id = pz._id || pz.id;
      const zj = id ? zonesJsonById.get(id) : undefined;
      return mergeZoneObjects(zj || {}, pz || {});
    });
  }

  // parse GPX track points so we can set startPoint/endPoint from indexRange
  const gpxPath = path.join(root, 'apps', 'web', 'Deur den Bocht Rally.gpx');
  let trkpts = [];
  if (fs.existsSync(gpxPath)) {
    const gpxRaw = fs.readFileSync(gpxPath, 'utf8');
    const re = /<trkpt[^>]*lat="([^"]+)"[^>]*lon="([^"]+)"[^>]*>/g;
    let m;
    while ((m = re.exec(gpxRaw)) !== null) {
      trkpts.push({ lat: parseFloat(m[1]), lng: parseFloat(m[2]) });
    }
  }

  const client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    useCdn: false,
    token: SANITY_TOKEN,
    apiVersion: '2024-01-01',
  });

  const editionRef = { _type: 'reference', _ref: env.SANITY_EDITION || 'edition-2026' };

  // helper: haversine distance (km)
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

  let order = 0;
  const docs = workPayload.map((zone) => {
    order += 1;
    // Friendly default names: use a rotating set of fun Dutch names when
    // the zone doesn't provide an explicit `title`.
    const friendlyNames = [
      'Zonsondergangroute',
      'Kastelen & Koffie',
      'Panorama Parade',
      'Dorpsrondje',
      'Bochtenbal',
      'Langs de Rivier',
    ];
    const defaultFriendly = `${friendlyNames[(order - 1) % friendlyNames.length]} ${order}`;
    const title = zone.title || defaultFriendly;
    // Normalize routeTip -> routeTips and build a raw description from routeTips
    if (!zone.routeTips && Array.isArray(zone.routeTip)) zone.routeTips = zone.routeTip;
    const rawDesc = Array.isArray(zone.routeTips) ? zone.routeTips.join('\n') : (zone.routeTips || zone.routeTip || '');
    // normalize description: remove any embedded 'highlights' or 'tip' fragments from upstream text
    let desc = rawDesc.split(/highlights:|highlights|tip:/i)[0].trim();
    // ensure it ends with a period and first letter uppercase
    if (desc && !/[.?!]$/.test(desc)) desc = desc.replace(/\s*$/, '.') ;
    desc = desc.replace(/\s+/g, ' ').replace(/\s+\./, '.');
    if (desc) desc = desc[0].toUpperCase() + desc.slice(1);
    // Split highlights into multiple routeTips so participants have choices
    // Base highlights from payload plus extra nearby POIs (to increase variety)
    const baseHighlights = Array.isArray(zone.highlights) ? zone.highlights.slice() : [];
    // Accept `center.lng`, `center.lon` or `center.longitude` depending on source JSON
    const zoneCenter = zone.center ? { lat: zone.center.lat, lng: (zone.center.lng ?? zone.center.lon ?? zone.center.longitude) } : (zone.startPoint ? zone.startPoint : null);

    // Find nearby POIs (sorted by distance) and include up to `maxHighlights`
    const maxHighlights = 12;
    const nearby = [];
    if (zoneCenter) {
      for (const p of pois) {
        const point = p.mapLocation && p.mapLocation.pointLatLon ? p.mapLocation.pointLatLon : (p.mapLocation && p.mapLocation.locationInfo && p.mapLocation.locationInfo.point) || null;
        if (!point) continue;
        const dist = haversineKm(zoneCenter, { lat: point[0], lng: point[1] });
        nearby.push({ id: p.id, dist });
      }
      nearby.sort((a, b) => a.dist - b.dist);
    }

    const additional = [];
    for (const n of nearby) {
      if (baseHighlights.find(h => h._ref === n.id)) continue;
      additional.push({ _type: 'reference', _ref: n.id });
      if (additional.length + baseHighlights.length >= maxHighlights) break;
    }

    const highlights = baseHighlights.concat(additional);
    const totalHighlights = highlights.length;
    // Decide how many route options based on highlights count
    let chunks = 1;
    if (totalHighlights >= 10) chunks = 4;
    else if (totalHighlights >= 6) chunks = 3;
    else if (totalHighlights >= 2) chunks = 2;

    function chunkArray(arr, n) {
      const out = Array.from({ length: n }, () => []);
      for (let i = 0; i < arr.length; i++) {
        out[i % n].push(arr[i]);
      }
      return out;
    }

    const highlightChunks = chunkArray(highlights, chunks);
    // Ensure rally zone distances are in the 30-40km range.
    const defaultBaseForZone = 32 + (order - 1) * 2; // yields 32,34,36,38 for 4 zones
    const baseEstimatedRaw = zone.estimatedDistance && zone.estimatedDistance >= 10 ? zone.estimatedDistance : defaultBaseForZone;
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
    const baseEstimated = Math.round(clamp(baseEstimatedRaw, 30, 40) * 10) / 10;

    // Prefer explicit `routeTips` provided in the payload/zones JSON. If present,
    // map them through to Sanity documents and preserve instruction fields
    // (exitInstructions / routeInstructions / rejoinInstructions). If no
    // explicit `routeTips` are present, fall back to the generated chunked options.
    let routeTips = [];

    // Helper: create a challenge based on a POI (shared for explicit/generated tips)
    function makeChallengeForPoi(p) {
      const cat = (p.mapLocation?.locationInfo?.poiCategory || '').toLowerCase();
      const name = p.mapLocation?.locationInfo?.customName || p.mapLocation?.locationInfo?.poiName || '';
      if (cat.includes('scenic') || /panoram/i.test(name)) return { type: 'photo', question: `Maak een foto van het uitzicht bij ${name}`, hint: 'Kies het best zichtbare panorama', points: 5, isActive: true };
      if (cat.includes('restaurant') || /cafe|bar|restaurant/i.test(name)) return { type: 'text', question: `Noem één aanbevolen gerecht of drankje bij ${name}`, hint: 'Proef of kijk op het menu ter plekke', points: 5, isActive: true };
      if (cat.includes('hotel') || /chateau|castle|kasteel/i.test(name)) return { type: 'text', question: `Maak een foto van een herkenbaar detail van ${name} en beschrijf het kort`, hint: 'Fenomenen als torens of poorten werken goed', points: 6, isActive: true };
      if (cat.includes('cave') || /grotte|grot/i.test(name)) return { type: 'photo', question: `Maak een foto van de ingang of bijzondere rotsformatie bij ${name}`, hint: 'Let op veiligheid en houd afstand', points: 6, isActive: true };
      return { type: 'photo', question: `Maak een foto van ${name} en deel één opvallend detail`, hint: 'Een close-up of overzichtsbeeld is prima', points: 5, isActive: true };
    }

    // Helper: build routeLocation objects from an array of highlight refs
    function createLocationsFromHighlights(highlightArray) {
      const arr = Array.isArray(highlightArray) ? highlightArray : [];
      const mapped = arr.map((h, idx) => {
        const id = h._ref || h.id || h;
        const poi = poiById.get(id);
        const point = poi && poi.mapLocation && poi.mapLocation.pointLatLon ? poi.mapLocation.pointLatLon : (poi && poi.mapLocation && poi.mapLocation.locationInfo && poi.mapLocation.locationInfo.point) || null;
        const poiName = poi?.mapLocation?.locationInfo?.customName || poi?.mapLocation?.locationInfo?.poiName || id || `Highlight ${idx + 1}`;
        return {
          _type: 'routeLocation',
          name: poiName,
          coordinates: { lat: point ? point[0] : 0, lng: point ? point[1] : 0 },
          type: 'highlight',
          description: poi?.mapLocation?.locationInfo?.formattedAddress || '',
          challenge: poi ? makeChallengeForPoi(poi) : { type: 'text', question: `Vertel iets over ${poiName}`, hint: '', points: 3, isActive: true },
        };
      });
      if (mapped.length === 0) {
        // fallback: use nearby POIs computed earlier
        const top = (nearby && nearby.length) ? nearby.slice(0, 6) : [];
        return top.map((n, idx) => {
          const poi = poiById.get(n.id);
          const point = poi && poi.mapLocation && poi.mapLocation.pointLatLon ? poi.mapLocation.pointLatLon : (poi && poi.mapLocation && poi.mapLocation.locationInfo && poi.mapLocation.locationInfo.point) || null;
          const poiName = poi?.mapLocation?.locationInfo?.customName || poi?.mapLocation?.locationInfo?.poiName || n.id;
          return { _type: 'routeLocation', name: poiName, coordinates: { lat: point ? point[0] : 0, lng: point ? point[1] : 0 }, type: 'highlight', description: poi?.mapLocation?.locationInfo?.formattedAddress || '', challenge: poi ? makeChallengeForPoi(poi) : { type: 'text', question: `Vertel iets over ${poiName}`, hint: '', points: 3, isActive: true } };
        });
      }
      return mapped;
    }

    // Normalize `routeTips` when provided as legacy string arrays
    if (Array.isArray(zone.routeTips)) {
      zone.routeTips = zone.routeTips.map((rt) => (typeof rt === 'string' ? { description: rt } : rt || {}));
    }
    if (Array.isArray(zone.routeTips) && zone.routeTips.length > 0) {
      routeTips = zone.routeTips.map((rt, idx) => {
        // Normalize locations if provided on the routeTip
        const locations = Array.isArray(rt.locations) ? rt.locations.map((loc) => {
          // If location already looks like a routeLocation, keep keys but normalize coords
          const coord = loc.coordinates || loc.coordinate || loc.coords || loc.location || null;
          let lat = null; let lng = null;
          if (coord && typeof coord === 'object') {
            lat = coord.lat ?? coord.latitude ?? coord[0] ?? null;
            lng = coord.lng ?? coord.lon ?? coord.longitude ?? coord[1] ?? null;
          }
          // If there's a POI reference, try to resolve it
          if (loc._ref || loc.id) {
            const poi = poiById.get(loc._ref || loc.id);
            if (poi) {
              const point = poi.mapLocation && poi.mapLocation.pointLatLon ? poi.mapLocation.pointLatLon : (poi.mapLocation && poi.mapLocation.locationInfo && poi.mapLocation.locationInfo.point) || null;
              if (point) { lat = point[0]; lng = point[1]; }
            }
          }
          const challenge = loc.challenge || loc.task || undefined;
          return {
            _type: 'routeLocation',
            name: loc.name || loc.title || 'Locatie',
            coordinates: { lat: lat || 0, lng: lng || 0 },
            type: loc.type || 'highlight',
            description: loc.description || loc.note || '',
            challenge,
          };
        }) : [];

        return {
          _type: 'routeTip',
          name: rt.name || `${title} — optie ${idx + 1}`,
          description: rt.description || rt.body || desc,
          routeType: rt.routeType || rt.type || 'mixed',
          difficulty: rt.difficulty || 'medium',
          estimatedDistance: rt.estimatedDistance || Math.round(clamp(baseEstimated * (1 + idx * 0.08), 30, 40) * 10) / 10,
          highlights: rt.highlights || (Array.isArray(rt.highlightsList) ? rt.highlightsList.join('; ') : (rt.highlightsText || '')),
          exitInstructions: rt.exitInstructions || rt.startInstructions || rt.startpuntInstructions || '',
          routeInstructions: rt.routeInstructions || rt.route || rt.routeBeschrijvingen || '',
          rejoinInstructions: rt.rejoinInstructions || rt.endInstructions || rt.eindpuntInstructions || '',
          warnings: rt.warnings || '',
          character: rt.character || '',
          color: rt.color || undefined,
          locations,
        };
      });
    } else {
      routeTips = highlightChunks.map((chunk, idx) => {
        const names = chunk.map(h => {
          const poi = poiById.get(h._ref);
          return poi ? (poi.mapLocation?.locationInfo?.customName || poi.mapLocation?.locationInfo?.poiName || poi.mapLocation?.locationInfo?.formattedAddress || h._ref) : h._ref;
        });
        const locations = chunk.map(h => {
          const poi = poiById.get(h._ref);
          if (!poi) return null;
          const point = poi.mapLocation && poi.mapLocation.pointLatLon ? poi.mapLocation.pointLatLon : (poi.mapLocation && poi.mapLocation.locationInfo && poi.mapLocation.locationInfo.point) || null;
          // create a challenge based on POI category / name
          const poiName = poi.mapLocation?.locationInfo?.customName || poi.mapLocation?.locationInfo?.poiName || 'POI';
          const poiCat = (poi.mapLocation?.locationInfo?.poiCategory || '') + '';
          return {
            _type: 'routeLocation',
            name: poiName,
            coordinates: { lat: point ? point[0] : 0, lng: point ? point[1] : 0 },
            type: 'highlight',
            description: poi.mapLocation?.locationInfo?.formattedAddress || '',
            challenge: makeChallengeForPoi(poi),
          };
        }).filter(Boolean);

        // richer, varied body for the option based on highlight types
        function generateDescription(namesList, highlightsList, idxOption) {
          const cats = { scenic: 0, restaurant: 0, castle: 0, cave: 0, park: 0, other: 0 };
          for (const h of highlightsList) {
            const poi = poiById.get(h._ref);
            const cat = poi?.mapLocation?.locationInfo?.poiCategory || '';
            const lower = (cat || '').toLowerCase();
            if (lower.includes('scenic') || lower.includes('panoram')) cats.scenic++;
            else if (lower.includes('restaurant') || lower.includes('bar') || lower.includes('cafe')) cats.restaurant++;
            else if (lower.includes('castle') || (poi && /chateau|castle|kasteel/i.test(poi.mapLocation?.locationInfo?.customName || ''))) cats.castle++;
            else if (lower.includes('cave') || /grotte|grot/i.test(poi.mapLocation?.locationInfo?.customName || '')) cats.cave++;
            else if (lower.includes('park') || lower.includes('garden')) cats.park++;
            else cats.other++;
          }
          const maxCat = Object.keys(cats).reduce((a, b) => (cats[a] > cats[b] ? a : b));
          const sample = namesList.slice(0, 6).join(', ');
          const commonIntro = namesList.length ? `In deze optie bezoek je o.a.: ${sample}.` : '';
          switch (maxCat) {
            case 'scenic':
              return `${desc}\n\n${commonIntro} Verwacht panoramische uitzichten, fotostops en korte beklimmingen.`;
              case 'restaurant':
                return `${desc}\n\n${commonIntro} Bevat lokale eetstops en mogelijkheden voor korte pauzes.`;
            case 'castle':
              return `${desc}\n\n${commonIntro} Deze optie bevat meerdere historische locaties en kastelen, rustig rijden aanbevolen.`;
            case 'cave':
              return `${desc}\n\n${commonIntro} Bezoeken aan grotten en natuurfenomenen; sommige afritten en paden kunnen smal zijn.`;
            case 'park':
              return `${desc}\n\n${commonIntro} Natuur en parkgebieden, goed voor ontspannende stops en korte wandelingen.`;
            default:
              // vary wording slightly by index to avoid identical text
              const variants = [
                `${desc}\n\n${commonIntro} Bochtige en afwisselende wegen, geschikt voor rijders die van dynamiek houden.`,
                `${desc}\n\n${commonIntro} Rustige binnenwegen met karakteristieke dorpjes en foto spots.`,
                `${desc}\n\n${commonIntro} Een evenwichtige mix van panoramische stukken en lokale bezienswaardigheden.`,
              ];
              return variants[idxOption % variants.length];
          }
        }

        const rawBody = generateDescription(names, chunk, idx);
        // keep descriptions neutral (no invitational prefixes)
        const body = rawBody;

        // distribute estimated distances across options but keep within 30-40km
        const optionEst = Math.round(clamp(baseEstimated * (1 + idx * 0.08), 30, 40) * 10) / 10;
        return {
          _type: 'routeTip',
          name: `${title} — optie ${idx + 1}`,
          description: body,
          routeType: 'mixed',
          difficulty: 'medium',
          estimatedDistance: optionEst,
          highlights: names.join('; '),
          locations,
        };
      });
    }

    // if we have a matching zone JSON with indexRange and parsed trkpts, set start/end
    const zoneJson = zonesJsonById.get(zone._id || zone.id);
    let computedStart = undefined;
    let computedEnd = undefined;
    if (zoneJson && Array.isArray(zoneJson.indexRange) && trkpts.length > 0) {
      const [sIdx, eIdx] = zoneJson.indexRange;
      const s = Math.max(0, Math.min(trkpts.length - 1, sIdx));
      const e = Math.max(0, Math.min(trkpts.length - 1, eIdx));
      computedStart = trkpts[s];
      computedEnd = trkpts[e];
    }

    // Ensure start/end are not too far from highlights: if they are, snap to nearest highlight
    const maxDistanceKm = 3; // threshold: 3 km
    function nearestHighlightPoint(highlightsArr) {
      let best = null;
      let bestDist = Infinity;
      for (const h of highlightsArr) {
        const id = h._ref || h.id || h;
        const poi = poiById.get(id);
        if (!poi) continue;
        const point = poi.mapLocation && poi.mapLocation.pointLatLon ? poi.mapLocation.pointLatLon : (poi.mapLocation && poi.mapLocation.locationInfo && poi.mapLocation.locationInfo.point) || null;
        if (!point) continue;
        const p = { lat: point[0], lng: point[1] };
        // compare to computedStart/end later
        // compute minimum distance
        // we'll return the one with smallest distance
        // but caller will compute distance from given coord
        if (!best) { best = p; bestDist = 0; }
      }
      return best;
    }

    // helper to find nearest highlight to a given coord
    function findNearestHighlightCoord(coord, highlightsArr) {
      if (!coord || !Array.isArray(highlightsArr) || highlightsArr.length === 0) return null;
      let best = null;
      let bestDist = Infinity;
      for (const h of highlightsArr) {
        const id = h._ref || h.id || h;
        const poi = poiById.get(id);
        if (!poi) continue;
        const point = poi.mapLocation && poi.mapLocation.pointLatLon ? poi.mapLocation.pointLatLon : (poi.mapLocation && poi.mapLocation.locationInfo && poi.mapLocation.locationInfo.point) || null;
        if (!point) continue;
        const p = { lat: point[0], lng: point[1] };
        const d = haversineKm(coord, p);
        if (d < bestDist) { bestDist = d; best = p; }
      }
      return { coord: best, dist: bestDist };
    }

    if (computedStart && highlights.length > 0) {
      const nearest = findNearestHighlightCoord(computedStart, highlights);
      if (nearest && nearest.dist > maxDistanceKm && nearest.coord) {
        console.log(`Start point for ${zone._id || zone.id || title} was ${nearest.dist.toFixed(2)}km from nearest highlight — snapping to highlight`);
        computedStart = nearest.coord;
      }
    }
    if (computedEnd && highlights.length > 0) {
      const nearestE = findNearestHighlightCoord(computedEnd, highlights);
      if (nearestE && nearestE.dist > maxDistanceKm && nearestE.coord) {
        console.log(`End point for ${zone._id || zone.id || title} was ${nearestE.dist.toFixed(2)}km from nearest highlight — snapping to highlight`);
        computedEnd = nearestE.coord;
      }
    }

    // Build a pleasant default description when none is provided. Keep it
    // concise, Dutch, and a bit playful so Studio cards don't look "Auto-generated".
    const defaultDesc = `${title}. Meerdere route-opties langs interessante plekken en fotostops. Geschatte afstand: ${baseEstimated} km.`;

    console.log("Prepared document for zone:", title, zone);
    function deriveLocationFromZone(z) {
      if (z.location) return z.location;
      // try nearest POI name
      if (z.center) {
        const coord = { lat: z.center.lat, lng: (z.center.lng ?? z.center.lon ?? z.center.longitude) };
        let best = null; let bestDist = Infinity;
        for (const p of pois) {
          const point = p.mapLocation && p.mapLocation.pointLatLon ? p.mapLocation.pointLatLon : (p.mapLocation && p.mapLocation.locationInfo && p.mapLocation.locationInfo.point) || null;
          if (!point) continue;
          const d = haversineKm(coord, { lat: point[0], lng: point[1] });
          if (d < bestDist) { bestDist = d; best = p; }
        }
        if (best && bestDist < 20) {
          return best.mapLocation?.locationInfo?.customName || best.mapLocation?.locationInfo?.poiName || best.mapLocation?.locationInfo?.formattedAddress || `${best.id}`;
        }
        // fallback to human-readable coords
        return `${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)}`;
      }
      return z.title || 'Onbekende locatie';
    }

    const doc = {
      _id: zone._id || `rallyZone-${order}`,
      _type: 'rallyZone',
      title,
      // provide a richer zone-level body and estimated distance
      description: (desc || defaultDesc) +
        `\n\nWat te verwachten: meerdere route-opties met verschillende highlights en afstanden.` +
        `\nGeschatte afstand zone: ${baseEstimated} km.`,
      estimatedDistance: baseEstimated,
      location: deriveLocationFromZone(zone),
      color: zone.color || 'orange',
      image: zone.image || undefined,
      reference_photo: zone.reference_photo || undefined,
      gpxRoute: zone.gpxRoute || zone.gpxFile || undefined,
      // make zones bigger by default
      radius_m: zone.radius_m || 120,
      is_open: typeof zone.is_open === 'boolean' ? zone.is_open : true,
      edition: editionRef,
      order,
      startPoint: zone.startPoint || computedStart || (zone.center ? { lat: zone.center.lat, lng: (zone.center.lng ?? zone.center.lon ?? zone.center.longitude) } : undefined),
      endPoint: zone.endPoint || computedEnd || undefined,
      routeTips,
    };

    // Attempt to derive an explicit endPoint from POIs named like 'RZ-<n> eind'
    (function ensureEndPointFromPois() {
      if (doc.endPoint && doc.endPoint.lat && doc.endPoint.lng) return;
      // try to extract RZ number from zone metadata
      let zoneNum = null;
      const idSource = (zone._id || zone.id || zone.title || '').toString();
      const m = idSource.match(/rz[-_ ]?(\d+)/i) || idSource.match(/rallyzone[-_ ]?(\d+)/i) || idSource.match(/rally[-_ ]?zone[-_ ]?(\d+)/i);
      if (m) zoneNum = m[1];
      if (!zoneNum) zoneNum = String(order);
      const re = new RegExp(`^RZ[- ]?${zoneNum}\\s*(eind|einde|end)$`, 'i');
      for (const p of pois) {
        const name = (p.mapLocation && p.mapLocation.locationInfo && (p.mapLocation.locationInfo.customName || p.mapLocation.locationInfo.poiName)) || '';
        if (re.test(name)) {
          const pt = p.mapLocation && p.mapLocation.pointLatLon ? p.mapLocation.pointLatLon : (p.mapLocation && p.mapLocation.locationInfo && p.mapLocation.locationInfo.point) || null;
          if (pt) {
            doc.endPoint = { lat: pt[0], lng: pt[1] };
            doc.endName = name;
            return;
          }
        }
      }
      // fallback: if we have highlights, use last highlight coord
      if (Array.isArray(highlights) && highlights.length) {
        const last = highlights[highlights.length - 1];
        const poi = poiById.get(last._ref || last.id || last);
        if (poi && poi.mapLocation) {
          const pt = poi.mapLocation.pointLatLon || (poi.mapLocation.locationInfo && poi.mapLocation.locationInfo.point) || null;
          if (pt) doc.endPoint = { lat: pt[0], lng: pt[1] };
        }
      }
    })();

    // Ensure chronological ordering of locations along GPX track and
    // synchronize routeTip start locations with zone-level startPoint.
      // If any routeTip lacks locations, populate them from highlights or nearby POIs
      if (Array.isArray(routeTips)) {
        routeTips = routeTips.map((rt, idx) => {
          rt.locations = Array.isArray(rt.locations) ? rt.locations.slice() : [];
          if (!rt.locations.length) {
            const from = (highlightChunks && highlightChunks[idx] && highlightChunks[idx].length) ? highlightChunks[idx] : highlights;
            rt.locations = createLocationsFromHighlights(from);
          }
          // populate routeInstructions if missing
          if (!rt.routeInstructions || rt.routeInstructions === '') {
            rt.routeInstructions = rt.locations.map(l => l.name).join(' → ');
          }
          return rt;
        });
      }

    if (trkpts && trkpts.length > 0 && doc.startPoint) {
      function nearestTrkptIndex(coord) {
        if (!coord) return null;
        let bestIdx = 0;
        let bestDist = Infinity;
        for (let i = 0; i < trkpts.length; i++) {
          const d = haversineKm(coord, trkpts[i]);
          if (d < bestDist) { bestDist = d; bestIdx = i; }
        }
        return bestIdx;
      }

      const zoneStartIdx = nearestTrkptIndex(doc.startPoint);

      doc.routeTips = Array.isArray(doc.routeTips) ? doc.routeTips.map((rt) => {
        // ensure locations array
        rt.locations = Array.isArray(rt.locations) ? rt.locations.slice() : [];

        // compute nearest trkpt index for each location
        const locsWithIdx = rt.locations.map((loc) => {
          const idx = nearestTrkptIndex(loc.coordinates || loc.location || loc.coordinate || { lat: 0, lng: 0 });
          return Object.assign({}, loc, { _trkIdx: typeof idx === 'number' ? idx : Infinity });
        });

        // ensure a start location exists and uses zone startPoint
        let startLoc = locsWithIdx.find(l => (l.type || '').toLowerCase() === 'start');
        if (startLoc) {
          startLoc.coordinates = { lat: doc.startPoint.lat, lng: doc.startPoint.lng };
          startLoc._trkIdx = zoneStartIdx;
        } else {
          startLoc = {
            _type: 'routeLocation',
            name: rt.name ? `${rt.name} - Start` : `${doc.title} - Start`,
            coordinates: { lat: doc.startPoint.lat, lng: doc.startPoint.lng },
            type: 'start',
            description: 'Startpunt',
            challenge: rt.locations && rt.locations[0] && rt.locations[0].challenge ? rt.locations[0].challenge : {},
            _trkIdx: zoneStartIdx,
          };
          locsWithIdx.unshift(startLoc);
        }

        // ensure the zone start is before other locations; if not, move zone start earlier
        const otherIdxs = locsWithIdx.filter(l => (l.type || '').toLowerCase() !== 'start').map(l => l._trkIdx).filter(n => Number.isFinite(n));
        const minOther = otherIdxs.length ? Math.min(...otherIdxs) : zoneStartIdx;
        if (zoneStartIdx > minOther) {
          const newStartIdx = Math.max(0, minOther - 1);
          const newStartPt = trkpts[newStartIdx];
          if (newStartPt) {
            doc.startPoint = { lat: newStartPt.lat, lng: newStartPt.lng };
            // update start loc(s)
            locsWithIdx.forEach(l => { if ((l.type || '').toLowerCase() === 'start') { l.coordinates = { lat: newStartPt.lat, lng: newStartPt.lng }; l._trkIdx = newStartIdx; } });
          }
        }

        // Ensure an explicit end location exists for each routeTip.
        // Use doc.endPoint (from RZ-* eind POI) if available, else fallback to last highlight.
        let endLoc = locsWithIdx.find(l => (l.type || '').toLowerCase() === 'end');
        const endCoord = doc.endPoint || null;
        if (endCoord) {
          const endIdx = nearestTrkptIndex(endCoord);
          if (endLoc) {
            endLoc.coordinates = { lat: endCoord.lat, lng: endCoord.lng };
            endLoc._trkIdx = typeof endIdx === 'number' ? endIdx : Infinity;
          } else {
            // Do not append the zone end as a location; keep locations as highlights only.
            rt.endPoint = { lat: endCoord.lat, lng: endCoord.lng };
            rt.endName = rt.name ? `${rt.name} - Eind` : `${doc.title} - Eind`;
            endLoc = {
              _type: 'routeLocation',
              name: rt.endName,
              coordinates: { lat: endCoord.lat, lng: endCoord.lng },
              type: 'end',
              description: 'Eindpunt',
              challenge: {},
              _trkIdx: typeof endIdx === 'number' ? endIdx : Infinity,
            };
          }
          // ensure rejoinInstructions mention the end name if available
          if (!rt.rejoinInstructions || rt.rejoinInstructions === '') {
            rt.rejoinInstructions = doc.endName ? `Eindpunt: ${doc.endName}` : 'Rejoin bij eindpunt';
          }
        } else {
          // fallback: if no doc.endPoint, record endPoint from last highlight but don't append
          if (!endLoc && locsWithIdx.length) {
            const last = locsWithIdx[locsWithIdx.length - 1];
            const lastIdx = last._trkIdx || Infinity;
            rt.endPoint = { lat: last.coordinates.lat, lng: last.coordinates.lng };
            rt.endName = rt.name ? `${rt.name} - Eind` : `${doc.title} - Eind`;
            endLoc = Object.assign({}, last, { type: 'end', name: rt.endName, _trkIdx: lastIdx + 1 });
            if (!rt.rejoinInstructions || rt.rejoinInstructions === '') rt.rejoinInstructions = `Rejoin bij ${rt.endName}`;
          }
        }

        // sort by track index ascending
        locsWithIdx.sort((a, b) => (a._trkIdx || Infinity) - (b._trkIdx || Infinity));

        // remove helper _trkIdx before returning
        rt.locations = locsWithIdx.map(({ _trkIdx, ...rest }) => rest);
        return rt;
      }) : doc.routeTips;
    }

    // Normalize and populate optional fields to ensure all schema fields are present
    // Zone-level defaults
    doc.estimatedDistance = doc.estimatedDistance || baseEstimated;
    doc.image = doc.image || { _type: 'image', asset: { _type: 'reference', _ref: `image-placeholder-${order}` } };
    doc.reference_photo = doc.reference_photo || { _type: 'image', asset: { _type: 'reference', _ref: `reference-photo-placeholder-${order}` } };
    doc.gpxRoute = doc.gpxRoute || (zone.gpxFile ? { _type: 'file', asset: { _type: 'reference', _ref: zone.gpxFile } } : { _type: 'file', asset: { _type: 'reference', _ref: `gpx-placeholder-${order}` } });

    // Ensure color uses allowed zone-level values, fallback to 'orange'
    const allowedZoneColors = ['green', 'yellow', 'orange', 'red'];
    if (!allowedZoneColors.includes((doc.color || '').toString())) doc.color = zone.color && allowedZoneColors.includes(zone.color) ? zone.color : 'orange';

    // RouteTip and location-level normalization
    doc.routeTips = Array.isArray(doc.routeTips) ? doc.routeTips.map((rt, rtIdx) => {
      rt.name = rt.name || `${doc.title} optie ${rtIdx + 1}`;
      rt.description = rt.description || '';
      rt.routeType = rt.routeType || 'mixed';
      rt.difficulty = rt.difficulty || 'medium';
      rt.estimatedDistance = rt.estimatedDistance || Math.round(baseEstimated * (1 + rtIdx * 0.05) * 10) / 10;
      rt.character = rt.character || '';
      rt.warnings = rt.warnings || '';
      rt.highlights = rt.highlights || '';
      rt.exitInstructions = rt.exitInstructions || '';
      rt.routeInstructions = rt.routeInstructions || '';
      rt.rejoinInstructions = rt.rejoinInstructions || '';
      // gpxFile for the routeTip
      rt.gpxFile = rt.gpxFile || (rt.gpxFile === null ? { _type: 'file', asset: { _type: 'reference', _ref: `gpx-tip-placeholder-${order}-${rtIdx + 1}` } } : { _type: 'file', asset: { _type: 'reference', _ref: `gpx-tip-placeholder-${order}-${rtIdx + 1}` } });

      rt.color = rt.color || '#CCCCCC';

      rt.locations = Array.isArray(rt.locations) ? rt.locations.map((loc, locIdx) => {
        // normalize coordinates object
        const coord = loc.coordinates || loc.coordinate || loc.coords || loc.location || { lat: 0, lng: 0 };
        const lat = coord.lat ?? coord[0] ?? 0;
        const lng = coord.lng ?? coord[1] ?? 0;
        loc.coordinates = { lat: Number(lat), lng: Number(lng) };
        loc.name = loc.name || `Locatie ${locIdx + 1}`;
        loc.type = loc.type || 'highlight';
        loc.description = loc.description || '';

        // normalize challenge object
        const ch = loc.challenge || {};
        ch.type = ch.type || 'text';
        ch.question = ch.question || (ch.type === 'photo' ? `Maak een foto bij ${loc.name}` : `Beantwoord de vraag bij ${loc.name}`);
        ch.hint = ch.hint || '';
        if (ch.type === 'multiple_choice') {
          ch.options = Array.isArray(ch.options) && ch.options.length ? ch.options : ['Optie A', 'Optie B', 'Optie C', 'Optie D'];
          ch.correctAnswer = ch.correctAnswer || ch.options[0];
        } else {
          ch.options = Array.isArray(ch.options) ? ch.options : [];
          ch.correctAnswer = ch.correctAnswer || '';
        }
        ch.points = typeof ch.points === 'number' ? ch.points : 5;
        ch.isActive = typeof ch.isActive === 'boolean' ? ch.isActive : true;

        loc.challenge = ch;
        return loc;
      }) : [];

      // Ensure there is an explicit end location for this routeTip.
      // Prefer zone-level endPoint, otherwise use last highlight coordinate.
      let endLoc = rt.locations.find(l => (l.type || '').toLowerCase() === 'end');
      if (!endLoc) {
        let endCoord = null;
        if (doc.endPoint && doc.endPoint.lat && doc.endPoint.lng) endCoord = { lat: doc.endPoint.lat, lng: doc.endPoint.lng };
        else if (zone.endPoint && zone.endPoint.lat && zone.endPoint.lng) endCoord = { lat: zone.endPoint.lat, lng: zone.endPoint.lng };
        else if (rt.locations && rt.locations.length) {
          const last = rt.locations[rt.locations.length - 1];
          if (last && last.coordinates) endCoord = { lat: last.coordinates.lat, lng: last.coordinates.lng };
        }

        if (endCoord) {
          // try to name the end location from a nearby POI
          let endName = `${doc.title} - Eind`;
          let bestPoi = null; let bestD = Infinity;
          for (const p of pois) {
            const point = p.mapLocation && p.mapLocation.pointLatLon ? p.mapLocation.pointLatLon : (p.mapLocation && p.mapLocation.locationInfo && p.mapLocation.locationInfo.point) || null;
            if (!point) continue;
            const d = haversineKm(endCoord, { lat: point[0], lng: point[1] });
            if (d < bestD) { bestD = d; bestPoi = p; }
          }
          if (bestPoi && bestD < 1.5) {
            endName = bestPoi.mapLocation?.locationInfo?.customName || bestPoi.mapLocation?.locationInfo?.poiName || endName;
          }
          // Do not append the zone end to rt.locations. Instead expose as metadata
          rt.endPoint = { lat: endCoord.lat, lng: endCoord.lng };
          rt.endName = endName;
          endLoc = { _type: 'routeLocation', name: endName, coordinates: { lat: endCoord.lat, lng: endCoord.lng }, type: 'end', description: 'Eindpunt', challenge: {} };
        }
      }

      // Populate rejoinInstructions to reference the end location when missing
      if ((!rt.rejoinInstructions || rt.rejoinInstructions === '') && endLoc) {
        rt.rejoinInstructions = `Voeg weer in op de hoofdroute bij ${endLoc.name}.`;
      }

      return rt;
    }) : [];

    return doc;
  });

  // Upsert documents sequentially
  // Ensure any placeholder asset references used by normalization exist as minimal docs
  const placeholderRefs = new Set();
  for (const d of docs) {
    // zone-level refs
    ['image', 'reference_photo', 'gpxRoute'].forEach((f) => {
      const val = d[f];
      if (val && val.asset && val.asset._ref && /placeholder/.test(val.asset._ref)) placeholderRefs.add(val.asset._ref);
    });
    if (Array.isArray(d.routeTips)) {
      d.routeTips.forEach((rt) => {
        if (rt.gpxFile && rt.gpxFile.asset && rt.gpxFile.asset._ref && /placeholder/.test(rt.gpxFile.asset._ref)) placeholderRefs.add(rt.gpxFile.asset._ref);
      });
    }
  }

  // Try to upload real local files for known placeholder patterns.
  // If a local file is found and uploaded, update all docs to reference the uploaded asset id.
  async function tryUploadLocalAsset(refId) {
    // map placeholder names to likely local file paths
    const mappings = [];
    // global main GPX
    mappings.push(path.join(root, 'apps', 'web', 'Deur den Bocht Rally.gpx'));
    mappings.push(path.join(root, 'apps', 'web', 'public', 'gpx', 'Deur den Bocht Rally.gpx'));
    // site-level recap image
    mappings.push(path.join(root, 'deur-den-bocht-recap.png'));
    // public icons
    mappings.push(path.join(root, 'apps', 'web', 'public', 'icon-512.png'));
    mappings.push(path.join(root, 'apps', 'web', 'public', 'icon-192.png'));

    // More specific mapping heuristics
    if (/^gpx(-|_)?placeholder/.test(refId) || /gpx-tip-placeholder/.test(refId) || /^skip-gpx-placeholder/.test(refId)) {
      // prefer GPX paths
      const candidates = [
        path.join(root, 'apps', 'web', 'public', 'gpx', 'Deur den Bocht Rally.gpx'),
        path.join(root, 'apps', 'web', 'Deur den Bocht Rally.gpx'),
      ];
      for (const p of candidates) if (fs.existsSync(p)) return { path: p, type: 'file' };
    }

    if (/image-placeholder|reference-photo-placeholder/.test(refId)) {
      const candidates = [
        path.join(root, 'deur-den-bocht-recap.png'),
        path.join(root, 'apps', 'web', 'public', 'icon-512.png'),
        path.join(root, 'apps', 'web', 'public', 'icon-192.png'),
      ];
      for (const p of candidates) if (fs.existsSync(p)) return { path: p, type: 'image' };
    }

    // fallback: check generic list
    for (const p of mappings) if (fs.existsSync(p)) return { path: p, type: p.endsWith('.gpx') ? 'file' : 'image' };
    return null;
  }

  // Map of placeholderRef -> uploaded asset id
  const uploadedMap = new Map();
  for (const refId of placeholderRefs) {
    try {
      const candidate = await tryUploadLocalAsset(refId);
      if (candidate) {
        const stream = fs.createReadStream(candidate.path);
        const filename = path.basename(candidate.path);
        let asset;
        if (candidate.type === 'image') {
          // eslint-disable-next-line no-await-in-loop
          asset = await client.assets.upload('image', stream, { filename });
        } else {
          // file (gpx)
          // eslint-disable-next-line no-await-in-loop
          asset = await client.assets.upload('file', stream, { filename });
        }
        if (asset && asset._id) {
          uploadedMap.set(refId, asset._id);
          console.log(`Uploaded local asset for ${refId} -> ${asset._id}`);
          continue;
        }
      }

      // fallback: create minimal placeholder doc in Sanity
      const docType = refId.startsWith('image-placeholder') || refId.startsWith('reference-photo-placeholder') ? 'sanity.imageAsset' : 'sanity.fileAsset';
      const placeholderDoc = { _id: refId, _type: docType, originalFilename: `${refId}.placeholder`, url: 'https://example.com/placeholder' };
      // eslint-disable-next-line no-await-in-loop
      await client.createIfNotExists(placeholderDoc);
      console.log('Ensured placeholder asset', refId);
    } catch (err) {
      console.error('Error handling placeholder asset', refId, err.message || err);
    }
  }

  // Replace any references in docs to uploaded asset ids
  if (uploadedMap.size > 0) {
    for (const d of docs) {
      function replaceRef(obj) {
        if (!obj || typeof obj !== 'object') return;
        for (const k of Object.keys(obj)) {
          const v = obj[k];
          if (v && typeof v === 'object' && v._type === 'reference' && typeof v._ref === 'string') {
            const newId = uploadedMap.get(v._ref);
            if (newId) obj[k] = { _type: 'reference', _ref: newId };
          } else if (v && typeof v === 'object') replaceRef(v);
        }
      }
      replaceRef(d);
    }
  }

  for (const d of docs) {
    try {
      // createOrReplace
      // eslint-disable-next-line no-await-in-loop
      const res = await client.createOrReplace(d);
      console.log('Upserted', res._id);
    } catch (err) {
      console.error('Error upserting', d._id, err.message || err);
    }
  }

  console.log('Done. Upserted', docs.length, 'rallyZone documents.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
