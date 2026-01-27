const fs = require('fs');
const path = require('path');

const gpxDir = path.join(__dirname, '../apps/web/public/gpx/zones');
const files = fs.readdirSync(gpxDir).filter(f => f.endsWith('.gpx')).sort();

console.log('📍 Rally Zone GPX Analysis\n');
console.log('='.repeat(80));

for (const file of files) {
  const content = fs.readFileSync(path.join(gpxDir, file), 'utf-8');
  
  // Extract first and last trkpt coordinates
  const trkpts = [...content.matchAll(/<trkpt lat="([^"]+)" lon="([^"]+)">/g)];
  
  if (trkpts.length > 0) {
    const first = trkpts[0];
    const last = trkpts[trkpts.length - 1];
    const name = content.match(/<name>(.*?)<\/name>/)?.[1] || 'Unknown';
    
    console.log(`\n${file.replace('.gpx', '')}:`);
    console.log(`  Name: ${name}`);
    console.log(`  Points: ${trkpts.length}`);
    console.log(`  Start: lat=${first[1]}, lng=${first[2]}`);
    console.log(`  End:   lat=${last[1]}, lng=${last[2]}`);
    console.log('  -'.repeat(40));
  }
}

console.log('\n' + '='.repeat(80));
console.log('✅ Analysis complete');
