#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function ensureNumber(v, fallback) { return typeof v === 'number' && !isNaN(v) ? v : fallback; }

function pickZoneColor(order) {
  const list = ['orange','red','green','yellow'];
  return list[(order - 1) % list.length];
}

function normalizeRouteType(rt) {
  if (!rt) return 'mixed';
  const s = rt.toString().toLowerCase();
  if (['offroad','technical','panoramic','highway','backroads','mixed'].includes(s)) return s;
  if (s.includes('tech')) return 'technical';
  if (s.includes('panor')) return 'panoramic';
  if (s.includes('road') || s.includes('back')) return 'backroads';
  return 'mixed';
}

function normalizeDifficulty(d) {
  if (!d) return 'medium';
  const s = d.toString().toLowerCase();
  if (['easy','medium','hard'].includes(s)) return s;
  if (s.includes('hard') || s.includes('moeilijk')) return 'hard';
  if (s.includes('easy') || s.includes('licht')) return 'easy';
  return 'medium';
}

function enrichChallenge(ch) {
  const c = Object.assign({}, ch || {});
  c.type = c.type || 'text';
  c.question = c.question || (c.type === 'photo' ? 'Maak een foto van deze locatie' : 'Beantwoord de vraag op deze locatie');
  c.hint = c.hint || '';
  if (c.type === 'multiple_choice') {
    c.options = Array.isArray(c.options) && c.options.length ? c.options : ['Optie A','Optie B','Optie C'];
    c.correctAnswer = c.correctAnswer || c.options[0];
  } else {
    c.options = Array.isArray(c.options) ? c.options : [];
    c.correctAnswer = c.correctAnswer || '';
  }
  c.points = ensureNumber(c.points, 5);
  c.isActive = typeof c.isActive === 'boolean' ? c.isActive : true;
  return c;
}

function enrichLocation(loc, idx) {
  const out = Object.assign({}, loc || {});
  out.name = out.name || `Locatie ${idx + 1}`;
  const coord = out.coordinates || out.coordinate || out.location || { lat: 0, lng: 0 };
  out.coordinates = { lat: Number(coord.lat || coord[0] || 0), lng: Number(coord.lng || coord[1] || 0) };
  out.type = out.type || 'highlight';
  out.description = out.description || '';
  out.challenge = enrichChallenge(out.challenge || {});
  return out;
}

function enrichRouteTip(rt, order, rtIdx) {
  const tip = Object.assign({}, rt || {});
  tip.name = tip.name || `Optie ${rtIdx + 1}`;
  tip.description = tip.description || 'Beschrijving niet opgegeven.';
  tip.routeType = normalizeRouteType(tip.routeType || tip.type);
  tip.difficulty = normalizeDifficulty(tip.difficulty);
  tip.estimatedDistance = ensureNumber(tip.estimatedDistance, 30 + (rtIdx * 2));
  tip.character = tip.character || '';
  tip.warnings = tip.warnings || '';
  tip.highlights = tip.highlights || '';
  tip.exitInstructions = tip.exitInstructions || '';
  tip.routeInstructions = tip.routeInstructions || '';
  tip.rejoinInstructions = tip.rejoinInstructions || '';
  tip.gpxFile = tip.gpxFile || { _type: 'file', asset: { _type: 'reference', _ref: `gpx-tip-placeholder-${order}-${rtIdx + 1}` } };
  tip.color = tip.color || (rtIdx === 0 ? '#D35400' : '#1E8449');
  tip.locations = Array.isArray(tip.locations) ? tip.locations.map(enrichLocation) : [];
  return tip;
}

function enrichZone(z, order) {
  const zone = Object.assign({}, z || {});
  zone._id = zone._id || `rallyZone-${order}`;
  zone.title = zone.title || `Rally Zone ${order}`;
  zone.location = zone.location || 'Regionale rallyzone';
  zone.description = zone.description || `Automatisch gegenereerde beschrijving voor ${zone.title}.`;
  zone.estimatedDistance = ensureNumber(zone.estimatedDistance, 32 + (order - 1) * 2);
  zone.color = (['green','yellow','orange','red'].includes((zone.color || '').toString()) ? zone.color : pickZoneColor(order));
  zone.radius_m = ensureNumber(zone.radius_m, 120);
  zone.is_open = typeof zone.is_open === 'boolean' ? zone.is_open : true;
  // legacy hidden fields
  zone.exit = zone.exit || 'Volg de aanwijzingen bij het vertrek.';
  zone.lus = zone.lus || '';
  zone.rejoin = zone.rejoin || 'Voeg weer in op de hoofdroute bij het eindpunt.';
  zone.checkpoints = Array.isArray(zone.checkpoints) ? zone.checkpoints : [];
  zone.checkpoint = zone.checkpoint || '';
  zone.codeHint = zone.codeHint || '';
  zone.solution = zone.solution || '';
  zone.validAnswers = Array.isArray(zone.validAnswers) ? zone.validAnswers : [];
  zone.points = ensureNumber(zone.points, 0);

  zone.image = zone.image || { _type: 'image', asset: { _type: 'reference', _ref: `image-placeholder-${order}` } };
  zone.reference_photo = zone.reference_photo || { _type: 'image', asset: { _type: 'reference', _ref: `reference-photo-placeholder-${order}` } };
  zone.gpxRoute = zone.gpxRoute || { _type: 'file', asset: { _type: 'reference', _ref: `gpx-placeholder-${order}` } };

  zone.routeTips = Array.isArray(zone.routeTips) && zone.routeTips.length ? zone.routeTips.map((rt, idx) => enrichRouteTip(rt, order, idx)) : [enrichRouteTip({}, order, 0)];

  // ensure startPoint and endPoint objects
  zone.startPoint = zone.startPoint || (zone.center ? { lat: zone.center.lat, lng: zone.center.lon } : { lat: 0, lng: 0 });
  zone.endPoint = zone.endPoint || zone.startPoint;

  // ensure edition ref
  zone.edition = zone.edition || { _type: 'reference', _ref: 'edition-2026' };

  return zone;
}

function main() {
  const root = path.resolve(__dirname, '..', '..');
  const pathIn = path.join(root, 'apps', 'web', 'app', 'rallyZones.json');
  if (!fs.existsSync(pathIn)) { console.error('rallyZones.json not found'); process.exit(1); }
  const zones = JSON.parse(fs.readFileSync(pathIn, 'utf8'));
  const out = zones.map((z, i) => enrichZone(z, i + 1));
  fs.writeFileSync(pathIn, JSON.stringify(out, null, 2), 'utf8');
  console.log('Enriched', out.length, 'rallyZones in', pathIn);
}

main();
