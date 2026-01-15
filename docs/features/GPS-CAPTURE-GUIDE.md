# GPS Capture Implementation Guide

## Overview
This document describes the GPS location capture system implemented for tracking rider positions at rally zone entry and answer submission points.

## Architecture

### Data Flow
```
Rider Action → Browser Geolocation API → Form Submission → Server Processing → Supabase Storage
                                              ↓
                                         Hidden Inputs
                                              ↓
                                      rally_zone_submissions table
```

### Components Updated

#### 1. Zone Entry (zone.$zoneId.tsx)
**Purpose:** Capture GPS when rider starts a rally zone

**Implementation:**
- Form element with `ref` to access form data
- onClick handler on submit button that:
  1. Prevents default form submission
  2. Requests browser geolocation with `navigator.geolocation.getCurrentPosition()`
  3. Appends GPS data to FormData: `entryLatitude`, `entryLongitude`, `entryAccuracy`
  4. Submits form with GPS data
  5. Falls back to GPS-less submission on permission denial

**Server-side (action):**
- Parses `entryLatitude`, `entryLongitude`, `entryAccuracy` from formData
- Creates `rally_zone_submissions` record with GPS coordinates
- Logs submission with GPS data for debugging

**Error Handling:**
- User sees warning: "⚠️ GPS kon niet worden bepaald - Je kunt toch doorgaan"
- Form still submits without GPS if browser denies permission

#### 2. Code Submission (dashboard.rally-submission.tsx)
**Purpose:** Capture GPS when rider submits checkpoint codes

**Implementation:**
- Regular form element (not React Router Form) with `ref`
- Custom `onSubmit` handler that:
  1. Detects which zones have codes entered
  2. Requests geolocation from browser
  3. Populates hidden inputs for each zone: `rz{n}_answer_lat`, `rz{n}_answer_lng`, `rz{n}_answer_accuracy`
  4. Submits form to server
  5. Falls back to GPS-less submission on permission denial or no codes entered

**Hidden Inputs:**
```jsx
{[1, 2, 3, 4, 5, 6, 7, 8].map((zoneId) => (
  <div key={`gps-${zoneId}`} style={{ display: 'none' }}>
    <input type="hidden" name={`rz${zoneId}_answer_lat`} />
    <input type="hidden" name={`rz${zoneId}_answer_lng`} />
    <input type="hidden" name={`rz${zoneId}_answer_accuracy`} />
  </div>
))}
```

**Server-side (action):**
- Collects GPS data for each zone from formData
- For each zone with submitted code:
  1. Verifies zone was started
  2. Updates `rally_zone_submissions` record with answer GPS
  3. Sets `answer_timestamp` to track submission time
  4. Logs update for debugging

#### 3. Database Schema (Supabase)
**Migration:** `scripts/add-checkin-locations.sql`

**New Columns:**
- `entry_latitude` (DECIMAL 10,8) - Rider's starting position
- `entry_longitude` (DECIMAL 11,8) - Rider's starting position
- `entry_accuracy` (DECIMAL 10,2) - GPS accuracy in meters
- `answer_latitude` (DECIMAL 10,8) - Code submission position
- `answer_longitude` (DECIMAL 11,8) - Code submission position
- `answer_accuracy` (DECIMAL 10,2) - GPS accuracy in meters
- `answer_timestamp` (TIMESTAMP) - When code was submitted

**Indexes:**
```sql
CREATE INDEX idx_rally_zone_submissions_entry_location 
ON rally_zone_submissions(entry_latitude, entry_longitude);

CREATE INDEX idx_rally_zone_submissions_answer_location 
ON rally_zone_submissions(answer_latitude, answer_longitude);
```

## Browser Geolocation API

### Permission Handling
- First call triggers browser permission prompt
- User can allow/deny GPS access
- Status persists in browser settings
- App gracefully handles denial by submitting without GPS

### Accuracy Metrics
- `accuracy` value in meters - indicates GPS precision
- Higher accuracy (lower number) = more precise location
- Typical values: 20-50m for mobile GPS

### Coordinates
- `latitude`: -90 to 90 degrees
- `longitude`: -180 to 180 degrees
- Stored as DECIMAL for precision

## Live Map Integration

### Visualization
The live map on `/live-map` displays:
- **Entry Points (🟢)** - Green markers showing where riders started each zone
- **Answer Points (🟡)** - Amber markers showing where riders submitted codes
- Popups showing timestamps and accuracy data
- Actual route lines for route visualization

### Query Integration
Live map loader fetches check-ins:
```typescript
const { data: checkIns } = await supabaseAdmin
  .from('rally_zone_submissions')
  .select('*')
  .eq('event_id', eventId);
```

Renders markers:
```typescript
if (checkIn.entry_latitude && checkIn.entry_longitude) {
  // Green marker for entry
}
if (checkIn.answer_latitude && checkIn.answer_longitude) {
  // Amber marker for answer
}
```

## Testing Checklist

- [ ] Run migration: `scripts/add-checkin-locations.sql` in Supabase
- [ ] Test zone entry form on mobile device
  - [ ] Confirm permission prompt appears
  - [ ] Confirm submission succeeds
  - [ ] Check Supabase: `entry_latitude`, `entry_longitude`, `entry_accuracy` populated
- [ ] Test code submission on mobile device
  - [ ] Enter codes for multiple zones
  - [ ] Confirm permission prompt appears (if first GPS use)
  - [ ] Confirm submission succeeds
  - [ ] Check Supabase: `answer_latitude`, `answer_longitude`, `answer_accuracy` populated for each zone
- [ ] View live map at `/live-map`
  - [ ] Confirm green markers for entry points
  - [ ] Confirm amber markers for answer points
  - [ ] Verify popup shows timestamps and accuracy
- [ ] Test permission denial
  - [ ] Deny GPS permission when prompted
  - [ ] Confirm form still submits without GPS
  - [ ] Check Supabase: columns are NULL for that submission
- [ ] Test on desktop (geolocation should work with browser settings)
- [ ] Test fallback: Verify form works if geolocation times out

## Debugging

### Server Logs
Zone entry:
```
[zone.$zoneId] submission created with GPS { zoneId, latitude, longitude, accuracy }
```

Code submission:
```
[dashboard.rally-submission] updated answer GPS for zone {i} { lat, lng, accuracy }
```

### Browser Console
```javascript
// Check if geolocation available
'geolocation' in navigator  // true/false

// View active permissions
navigator.permissions.query({name: 'geolocation'})
```

### Common Issues
1. **No GPS data in database**
   - Permission was denied
   - Browser doesn't support geolocation
   - Geolocation timed out (default 10s)
   
2. **High accuracy values (>100m)**
   - Indoor location (GPS weakened)
   - First location acquisition
   - Device GPS module issue

3. **Form submits but GPS fields empty**
   - Geolocation API call failed
   - Server receives form with null GPS fields
   - This is expected behavior (graceful fallback)

## Future Enhancements

1. **Accuracy Warnings**
   - Display accuracy to user before submission
   - Suggest waiting for better GPS signal if accuracy > 50m

2. **Geofencing**
   - Verify riders are at zone start/end points
   - Show warnings if far from expected location

3. **Historical Tracking**
   - Store multiple GPS readings per zone
   - Show trail path from entry to answer point

4. **Export/Analysis**
   - Export GPS traces for post-event analysis
   - Generate heatmaps of rider patterns
   - Analyze time-distance relationships

## API References

### Browser Geolocation API
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    position.coords.latitude    // -90 to 90
    position.coords.longitude   // -180 to 180
    position.coords.accuracy    // meters
    position.timestamp          // milliseconds since epoch
  },
  (error) => {
    // PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT
    error.code
    error.message
  },
  {
    enableHighAccuracy: false,  // true for better accuracy, slower, more power
    timeout: 10000,             // milliseconds
    maximumAge: 0               // max age of cached position
  }
);
```

### Supabase Query Examples
```sql
-- Find all entries in a geographic area
SELECT * FROM rally_zone_submissions
WHERE entry_latitude BETWEEN lat1 AND lat2
  AND entry_longitude BETWEEN lng1 AND lng2;

-- Find riders with GPS data
SELECT participant_id, zone_id, entry_timestamp, entry_accuracy
FROM rally_zone_submissions
WHERE entry_latitude IS NOT NULL
ORDER BY entry_timestamp DESC;

-- Calculate average accuracy per zone
SELECT zone_id, AVG(entry_accuracy) as avg_accuracy
FROM rally_zone_submissions
WHERE entry_latitude IS NOT NULL
GROUP BY zone_id;
```
