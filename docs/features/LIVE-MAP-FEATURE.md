# Live Rally Map Feature

## Overview
The Live Rally Map is a protected, interactive map that shows the rally route, rally zones, and real-time event markers during the event day. It's only accessible to logged-in users on the event day (May 16, 2026), with admin users having preview access at any time.

## Features

### For Participants
- **GPX Route Display**: View the complete rally route overlaid on an interactive map
- **Rally Zone Markers**: See start and end points for all rally zones with status (open/closed)
- **Live Event Markers**: View real-time updates about:
  - 🚧 Road Closures
  - 🚨 Accidents
  - ⛔ Stops
  - 🌊 Flooded Roads
  - ⚠️ Warnings
  - ℹ️ Information
  - 💧 Water/Fuel Stations
- **Live Location Tracking**: Your current GPS position is shown on the map with a purple marker
- **Auto-Refresh**: Map automatically refreshes every 30 seconds to get new event markers

### For Admins
- **Event Marker Management**: Create, activate/deactivate, and delete event markers in real-time
- **Preview Access**: Access the map before the event day for testing
- **Severity Levels**: Assign severity to markers (low, medium, high, critical)

## Access Control

### User Access
- **Route**: `/live-map`
- **Requirements**: 
  - Must be logged in
  - Only accessible on event day (2026-05-16)
  - Admins can access anytime

### Admin Management
- **Route**: `/admin/event-markers`
- **Requirements**: Admin privileges

## Setup Instructions

### 1. Upload GPX Route File

1. Navigate to Sanity Studio: `http://localhost:3333`
2. Go to **Site Configuration**
3. Find the **GPX Route File** field
4. Upload your rally route GPX file
5. Publish the changes

### 2. Create Event Markers (Admin Only)

1. Log in as admin
2. Go to Admin Dashboard (`/admin`)
3. Click **Event Markers** card
4. Click **+ Add Marker**
5. Fill in the form:
   - **Title**: Brief event name (e.g., "Road Closure at Intersection")
   - **Event Type**: Select from dropdown
   - **Description**: Detailed information
   - **Latitude/Longitude**: GPS coordinates of the event
   - **Severity**: How critical the event is
6. Click **Create Event Marker**

The marker will immediately appear on the live map for all users.

### 3. Managing Event Markers

From the `/admin/event-markers` page, you can:
- **Toggle Status**: Click the Active/Inactive button to show/hide markers
- **Delete**: Remove markers that are no longer relevant
- **View Map**: Quick link to see the live map

## Technical Details

### File Structure
```
apps/web/app/
├── routes/
│   ├── live-map.tsx                    # Main map page with auth
│   └── admin.event-markers.tsx         # Admin management page
├── components/
│   └── LiveEventMap.tsx                # Map rendering component
```

### Sanity Schema
```
sanity-studio/schemaTypes/
├── eventMarker.ts                      # Event marker schema
└── siteConfig.ts                       # Added GPX file field
```

### Key Features
- **Auto-refresh**: Map revalidates every 30 seconds
- **Client-side rendering**: Leaflet map is dynamically imported
- **GPS tracking**: Real-time location updates using Geolocation API
- **Responsive**: Works on mobile and desktop

## Usage Tips

### For Participants
1. Allow location access when prompted for best experience
2. Tap markers to see detailed information
3. Use the refresh button if you don't see latest updates
4. Legend is shown in bottom-left corner

### For Admins
1. Create markers BEFORE the event for planned stops/stations
2. Add real-time markers during the event for unexpected situations
3. Mark markers as inactive instead of deleting (to preserve history)
4. Use appropriate severity levels to help riders prioritize information

## Event Day Checklist

### Before Event (Admin Tasks)
- [ ] Upload GPX route file to Sanity
- [ ] Verify all rally zones have correct start/end coordinates
- [ ] Create planned event markers (water stations, fuel stops, etc.)
- [ ] Test map access with test user account
- [ ] Verify auto-refresh is working

### During Event (Admin Tasks)
- [ ] Monitor for incoming reports
- [ ] Create event markers for unexpected situations
- [ ] Update or deactivate resolved markers
- [ ] Communicate major updates to participants

### After Event
- [ ] Review which markers were most useful
- [ ] Export data for future reference
- [ ] Archive or delete temporary markers

## Troubleshooting

### Map not loading
- Check that Leaflet CSS is loaded
- Verify GPX file URL is accessible
- Check browser console for errors

### Location not showing
- Ensure user granted location permissions
- Check if device has GPS enabled
- May not work in some browsers (private/incognito)

### Markers not updating
- Verify auto-refresh is enabled
- Manually click refresh button
- Check network connectivity

### Admin can't create markers
- Verify admin privileges in database
- Check that edition reference is correct
- Validate latitude/longitude values

## Environment Variables

The feature uses:
- `EVENT_DATE`: The date when the map becomes accessible (default: 2026-05-16)
- `SANITY_PROJECT_ID`: Your Sanity project ID
- `SANITY_TOKEN`: Sanity auth token with read/write permissions

## Future Enhancements

Potential improvements:
- [ ] Push notifications for critical events
- [ ] Upload event photos to markers
- [ ] Participant reporting feature
- [ ] Historical replay of event day
- [ ] Export map data after event
- [ ] Integration with Strava or other tracking apps
- [ ] Offline map caching for poor connectivity areas

## Security Notes

- Event markers are public to all logged-in users
- Only admins can create/modify markers
- GPX file should not contain sensitive information
- Location tracking is client-side only (not stored server-side)
