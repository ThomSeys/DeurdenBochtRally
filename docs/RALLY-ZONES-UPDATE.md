# Rally Zones Update - Real GPX Coordinates

## Summary

Updated all 8 rally zones to use **real coordinates extracted from actual GPX loop files** instead of fictional Belgian city locations.

## What Changed

### Before (Incorrect)
- Rally zones placed at random Belgian city centers
- Coordinates didn't match actual route
- Zones treated as point checkpoints (start = end location)
- No actual distance covered

### After (Correct)
- Rally zones extracted from actual GPX loop files
- Coordinates match real route design
- Zones are actual **loops/circuits** with distinct exit and rejoin points
- Each zone covers real riding distance

## Rally Zone Coordinates (Extracted from GPX Files)

### Rally Zone 1: Leie Valley Loop
- **Source**: `rz1-leie-valley-loop.gpx` (3 points)
- **Start**: lat=51.01308, lng=3.61875
- **End**: lat=50.88479, lng=3.58042
- **Character**: Scenic loop along River Leie

### Rally Zone 2: Ronse Heuvelzone
- **Source**: `rz2-ronse-heuvelzone.gpx` (4 points)
- **Start**: lat=50.72486, lng=3.68384
- **End**: lat=50.58285, lng=3.80251
- **Character**: Challenging hill climbs

### Rally Zone 3: Tussen Schelde en Dender
- **Source**: `rz3-tussen-schelde-en-dender.gpx` (3 points)
- **Start**: lat=50.60471, lng=4.20145
- **End**: lat=50.56327, lng=4.23794
- **Character**: Loop between two rivers

### Rally Zone 4: Pays des Collines
- **Source**: `rz4-pays-des-collines.gpx` (4 points)
- **Start**: lat=50.42103, lng=4.28173
- **End**: lat=50.22224, lng=4.41212
- **Character**: Rolling hills circuit

### Rally Zone 5: Samber Valley Challenge
- **Source**: `rz5-samber-valley-challenge.gpx` (5 points)
- **Start**: lat=50.10595, lng=4.66004
- **End**: lat=49.87992, lng=4.904
- **Character**: Extended valley ride

### Rally Zone 6: Ardennen Panorama Route
- **Source**: `rz6-ardennen-panorama-route.gpx` (5 points)
- **Start**: lat=49.78753, lng=5.17524
- **End**: lat=50.13412, lng=5.28853
- **Character**: Mountain panorama loop

### Rally Zone 7: Vallei van de Ourthe
- **Source**: `rz7-vallei-van-de-ourthe.gpx` (4 points)
- **Start**: lat=50.13375, lng=5.53609
- **End**: lat=50.12837, lng=5.7865
- **Character**: River valley circuit

### Rally Zone 8: Signal de Botrange Finale
- **Source**: `rz8-signal-de-botrange-finale.gpx` (3 points)
- **Start**: lat=50.1569, lng=5.73486
- **End**: lat=50.24155, lng=5.7507
- **Character**: Summit climb to Belgium's highest point

## Rally Zone Concept

Rally zones are **loops/circuits** that:
1. Exit the main route at a specific point
2. Follow a scenic/challenging circuit
3. Cover actual riding distance
4. Rejoin the main route at a different point

They are NOT just checkpoints at city centers!

## Files Modified

- `scripts/generate-concept-b-mock-data.ts`: Updated with real GPX coordinates
- `scripts/analyze-gpx-zones.js`: New script to extract coordinates from GPX files

## Data Import

Run the import script to apply changes:
```bash
bash scripts/import-clean-data.sh
```

This will:
1. Delete all existing check-ins
2. Delete all Sanity rally zone documents
3. Re-import all zones with correct coordinates
4. Create sample check-ins for testing

## Verification

Check the live map to verify:
- Rally zone start markers appear at correct locations
- Rally zone end markers appear at different locations
- Markers align with the blue route line shown on the map
- Zones are positioned along the actual route (not at random cities)

## Next Steps

1. ✅ Coordinates extracted from GPX files
2. ✅ Mock data updated with real coordinates
3. ✅ Data imported to Sanity
4. 🔲 Verify on live map that markers match route
5. 🔲 Test zone check-in/check-out functionality
6. 🔲 Update zone descriptions with more accurate landmarks
