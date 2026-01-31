// Script to create initial feature flags in Sanity
import { createClient } from '@sanity/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.vercel
config({ path: resolve(process.cwd(), '.env.vercel') });

const client = createClient({
  projectId: 'tp2nrvnd',
  dataset: 'production',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
  apiVersion: '2024-01-01',
});

const featureFlags = [
  {
    _type: 'featureFlags',
    name: 'Registratie Open',
    key: { _type: 'slug', current: 'registration-open' },
    enabled: true,
    description: 'Schakel in om nieuwe registraties toe te staan. Schakel uit om registraties te sluiten.',
    category: 'registration',
  },
  {
    _type: 'featureFlags',
    name: 'Rally Zones Enabled',
    key: { _type: 'slug', current: 'rally-zones-enabled' },
    enabled: true,
    description: 'Schakel het volledige rally zones systeem in (check-ins, QR codes, zones pagina)',
    category: 'rally',
  },
  {
    _type: 'featureFlags',
    name: 'Photo Gallery',
    key: { _type: 'slug', current: 'photo-gallery-enabled' },
    enabled: true,
    description: 'Toon de fotogalerij waar deelnemers foto\'s kunnen uploaden en bekijken',
    category: 'community',
  },
  {
    _type: 'featureFlags',
    name: 'Ride Stories / Blog',
    key: { _type: 'slug', current: 'ride-stories-enabled' },
    enabled: true,
    description: 'Schakel het ride stories / blog systeem in voor deelnemers',
    category: 'community',
  },
  {
    _type: 'featureFlags',
    name: 'Live Map',
    key: { _type: 'slug', current: 'live-map-enabled' },
    enabled: true,
    description: 'Toon de live kaart met real-time deelnemers locaties',
    category: 'rally',
  },
  {
    _type: 'featureFlags',
    name: 'Push Notifications',
    key: { _type: 'slug', current: 'push-notifications-enabled' },
    enabled: true,
    description: 'Schakel push notificaties in voor rally updates en zone openings',
    category: 'general',
  },
  {
    _type: 'featureFlags',
    name: 'Leaderboard',
    key: { _type: 'slug', current: 'leaderboard-enabled' },
    enabled: false,
    description: 'Toon het leaderboard met rankings (momenteel uitgeschakeld voor story-focused ervaring)',
    category: 'community',
  },
  {
    _type: 'featureFlags',
    name: 'Profile Editing',
    key: { _type: 'slug', current: 'profile-editing-enabled' },
    enabled: true,
    description: 'Sta deelnemers toe hun profiel te bewerken',
    category: 'general',
  },
  {
    _type: 'featureFlags',
    name: 'Paper Roadbook Option',
    key: { _type: 'slug', current: 'paper-roadbook-option' },
    enabled: true,
    description: 'Toon de optie voor papieren roadbook bij registratie',
    category: 'registration',
  },
  {
    _type: 'featureFlags',
    name: 'Admin Dashboard',
    key: { _type: 'slug', current: 'admin-dashboard-enabled' },
    enabled: true,
    description: 'Schakel admin functies in (zone control, manual scan, reports)',
    category: 'admin',
  },
  {
    _type: 'featureFlags',
    name: 'Emergency SOS',
    key: { _type: 'slug', current: 'emergency-sos-enabled' },
    enabled: true,
    description: 'Schakel de nood SOS functie in voor deelnemers',
    category: 'general',
  },
  {
    _type: 'featureFlags',
    name: 'Achievements System',
    key: { _type: 'slug', current: 'achievements-enabled' },
    enabled: true,
    description: 'Schakel het achievements/badges systeem in',
    category: 'community',
  },
];

async function createFeatureFlags() {
  console.log('🚀 Creating feature flags in Sanity...\n');

  for (const flag of featureFlags) {
    try {
      // Check if flag already exists
      const existing = await client.fetch(
        `*[_type == "featureFlags" && key.current == $key][0]`,
        { key: flag.key.current }
      );

      if (existing) {
        console.log(`⏭️  Skipping "${flag.name}" - already exists`);
        continue;
      }

      const result = await client.create(flag);
      console.log(`✅ Created "${flag.name}" (${flag.key.current})`);
    } catch (error) {
      console.error(`❌ Error creating "${flag.name}":`, error);
    }
  }

  console.log('\n✨ Done!');
}

createFeatureFlags().catch(console.error);
