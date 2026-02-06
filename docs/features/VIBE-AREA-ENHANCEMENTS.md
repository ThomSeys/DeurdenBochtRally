# Vibe Area Enhancements: Spotify & Weather

## Overview

De Vibe Area op het dashboard heeft twee nieuwe features:
- **Spotify Playlist**: Event soundtrack embed
- **Live Weather**: Real-time weer per rally zone

Beide features zijn volledig feature-flag gestuurd en kunnen onafhankelijk aan/uit gezet worden via Sanity CMS.

## 1. Spotify Playlist Feature

### What It Does
Toont een ingesloten Spotify playlist op het dashboard voor de "event soundtrack". Ideaal voor deelnemers die een perfecte rijplaylist willen.

### Configuration

#### Step 1: Get Spotify Embed URL
1. Open je Spotify playlist
2. Klik op de `...` menu → Share → Embed playlist
3. Kopieer de embed URL (format: `https://open.spotify.com/embed/playlist/...`)

#### Step 2: Add to Sanity
1. Open Sanity Studio
2. Ga naar Site Configuration
3. Vul het veld **"Spotify Playlist Embed URL"** in met je embed URL
4. Publiceer de wijziging

#### Step 3: Enable Feature Flag
In Sanity Studio onder Feature Flags:
- **Key**: `spotify-playlist-enabled`
- **Status**: Enabled
- **Category**: engagement

### Technical Details
- **Location**: `/apps/web/app/routes/dashboard._index.tsx` (line ~1000)
- **Sanity Field**: `siteConfig.spotifyPlaylistUrl`
- **Feature Flag**: `spotify-playlist-enabled`

## 2. Live Weather Feature

### What It Does
Toont real-time weersinformatie voor elke rally zone:
- Huidige temperatuur en gevoelstemperatuur
- Weersomstandigheden (zon, regen, bewolking)
- Windsnelheid
- Kans op regen
- **Weeralerts** (rood gemarkeerd bij gevaar)

### Configuration

#### Step 1: Enable Feature Flag (That's it!)
In Sanity Studio onder Feature Flags:
- **Key**: `weather-enabled`
- **Status**: Enabled
- **Category**: safety

**No API key required!** De weather feature gebruikt [Open-Meteo](https://open-meteo.com), een volledig gratis en open-source weather API. Het werkt direct out-of-the-box zonder registratie of configuratie.

### Features
- **Multi-zone support**: Schakel tussen zones via buttons
- **Auto-refresh**: Elke 10 minuten nieuwe data
- **Weather alerts**: Automatische waarschuwingen bij slecht weer
  - Rood: Severe alerts (storm, extreme weather)
  - Oranje: Warnings (matige waarschuwingen)
  - Blauw: Info (algemene info)
- **Safety-first design**: Alerts krijgen rode achtergrond voor max zichtbaarheid

### Technical Details
- **API Route**: `/apps/web/app/routes/api.weather.ts`
- **Component**: `WeatherWidget` in `dashboard._index.tsx`
- **Weather Provider**: [Open-Meteo](https://open-meteo.com) - Gratis, geen API key
- **Refresh Interval**: 600000ms (10 minuten)
- **Cache**: API responses worden 10 minuten gecached
- **Rate Limits**: Geen - Open-Meteo is onbeperkt beschikbaar

## Feature Flag Management

Beide features kunnen onafhankelijk worden in/uitgeschakeld via Sanity CMS:

### Master Control
- **vibe-area-enabled**: Toont/verbergt hele vibe area (inclusief live feed, team vibe, recap)

### Individual Controls
- **spotify-playlist-enabled**: Spotify embed aan/uit
- **weather-enabled**: Weather widget aan/uit
- **live-feed-enabled**: Live activity feed
- **team-vibe-enabled**: Crew progress
- **recap-enabled**: Tijdcapsule

## Deployment Checklist

### Pre-Deployment
- [ ] Spotify playlist URL ingesteld in Sanity siteConfig
- [ ] Feature flags gepubliceerd in Sanity
- [ ] Lokaal getest met beide features enabled

### Post-Deployment
- [ ] Controleer of weather data correct laadt
- [ ] Verify Spotify embed laadt correct
- [ ] Test feature flags (enable/disable via Sanity)
- [ ] Check mobile responsive design

## Troubleshooting

### Spotify Playlist Not Showing
1. Check feature flag is enabled in Sanity
2. Verify `spotifyPlaylistUrl` is filled in siteConfig
3. Test embed URL in browser (should load Spotify player)
4. Check browser console for iframe errors

### Weather Not Loading
1. Check browser console for API errors
2. Verify rally zones have `startLocation` coordinates
3. Check network tab: `/api/weather` calls should return 200
4. Test Open-Meteo API directly: `https://api.open-meteo.com/v1/forecast?latitude=51.09&longitude=3.44&current=temperature_2m`

### Feature Flags Not Working
1. Clear feature flag cache (wait 5 minutes or restart server)
2. Verify flags are published (not drafts) in Sanity
3. Check flag keys match exactly: `spotify-playlist-enabled`, `weather-enabled`
4. Inspect loader data in React DevTools

## Future Enhancements

### Spotify
- [ ] Meerdere playlists (per zone of per mood)
- [ ] Shuffle/autoplay controls
- [ ] Track van de dag highlight

### Weather
- [ ] Extended forecast (3-hour, 24-hour)
- [ ] Route weather analysis (hele parcours)
- [ ] Push notifications voor weeralerts
- [ ] Historical weather data (post-event recap)

## Code Structure

```
apps/web/app/
├── routes/
│   ├── dashboard._index.tsx      # Main dashboard + WeatherWidget component
│   └── api.weather.ts            # Weather API endpoint
├── lib/
│   └── feature-flags.server.ts   # Feature flag keys
└── ...

sanity-studio/
└── schemaTypes/
    ├── siteConfig.ts             # spotifyPlaylistUrl field
    └── featureFlags.ts           # Feature flag definitions
```

## Credits

- **Weather API**: [Open-Meteo](https://open-meteo.com) - Free & Open Source Weather API
- **Music**: Spotify Web Embed API
- **Design**: Gent-inspired color scheme (green/sky blues)
