# Directus CMS Setup Guide

## Quick Start: Host Directus for Free

Je kunt Directus op meerdere manieren gratis hosten:

### Option 1: Directus Cloud (Recommended - Easiest)
1. Ga naar [directus.cloud](https://directus.cloud)
2. Maak een gratis account
3. Kies "Community Cloud" tier (gratis)
4. Connect je Supabase database:
   - Database Type: PostgreSQL
   - Host: `db.xxxxxxxxxxxxx.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: [je Supabase password]
   - SSL: Enabled

### Option 2: Railway.app (Free $5/month credits)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and create project
railway login
railway init

# Add Directus template
railway add
# Selecteer "Directus" uit de template lijst

# Link je Supabase database via environment variables
railway variables set DB_CLIENT=pg
railway variables set DB_HOST=db.xxxxxxxxxxxxx.supabase.co
railway variables set DB_PORT=5432
railway variables set DB_DATABASE=postgres
railway variables set DB_USER=postgres
railway variables set DB_PASSWORD=your-supabase-password
railway variables set DB_SSL=true

# Deploy!
railway up
```

### Option 3: Docker op DigitalOcean (Free $200 credits voor nieuwe accounts)
```bash
# Create docker-compose.yml
version: '3'
services:
  directus:
    image: directus/directus:latest
    ports:
      - 8055:8055
    environment:
      KEY: 'replace-with-random-value'
      SECRET: 'replace-with-random-value'
      DB_CLIENT: 'pg'
      DB_HOST: 'db.xxxxxxxxxxxxx.supabase.co'
      DB_PORT: '5432'
      DB_DATABASE: 'postgres'
      DB_USER: 'postgres'
      DB_PASSWORD: 'your-supabase-password'
      DB_SSL: 'true'
      ADMIN_EMAIL: 'admin@example.com'
      ADMIN_PASSWORD: 'd1r3ctu5'
      PUBLIC_URL: 'https://your-domain.com'

# Deploy to DigitalOcean App Platform (Free tier beschikbaar)
```

## Step 2: Configure Collections

Na het opstarten van Directus, log in op het admin panel en maak deze collections aan:

### 1. Sponsors Collection
```
Collection Name: sponsors
Fields:
- id (Primary Key, Auto-increment)
- name (String, Required)
- logo (Image, Required)
- website (String, Optional)
- order (Integer, Default: 0)
- status (Dropdown: published/draft/archived, Default: published)
```

### 2. Site Config Collection
```
Collection Name: site_config
Fields:
- id (Primary Key, Auto-increment)
- event_name (String)
- event_date (Date)
- event_location (String)
- event_tagline (Text)
- contact_email (String)
- contact_whatsapp (String)
- contact_location (String)
- social_facebook (String)
- social_instagram (String)
- social_strava (String)
```

### 3. Stats Collection
```
Collection Name: stats
Fields:
- id (Primary Key, Auto-increment)
- label (String, Required)
- value (String, Required)
- icon (String, Required)
- order (Integer, Default: 0)
```

### 4. Pricing Tiers Collection
```
Collection Name: pricing_tiers
Fields:
- id (Primary Key, Auto-increment)
- name (String, Required)
- price (Integer, Required)
- features (JSON, Required)
- highlighted (Boolean, Default: false)
- order (Integer, Default: 0)
- status (Dropdown: published/draft, Default: published)
```

### 5. Rally Zones Collection
```
Collection Name: rally_zones
Fields:
- id (Primary Key, Auto-increment)
- title (String, Required)
- description (Text, Required)
- image (Image, Optional)
- order (Integer, Default: 0)
- status (Dropdown: published/draft, Default: published)
```

## Step 3: Environment Variables

Voeg deze toe aan je `.env` bestand:

```env
# Directus CMS
DIRECTUS_URL="https://your-directus-instance.com"
# Of voor Railway/Directus Cloud krijg je automatisch een URL
```

## Step 4: Public Access

In Directus admin panel:
1. Ga naar **Settings** > **Roles & Permissions**
2. Klik op **Public** role
3. Enable **READ** permission voor alle collections:
   - sponsors
   - site_config
   - stats
   - pricing_tiers
   - rally_zones

Dit zorgt ervoor dat je Remix app de data kan ophalen zonder authenticatie.

## Migrate Existing Data

Je kunt je bestaande data uit `/app/content/*.ts` handmatig invoeren in Directus, of deze import scripts gebruiken:

### Import Sponsors
```typescript
// scripts/import-sponsors.ts
import { sponsors } from '../apps/web/app/content/sponsors';
import { createDirectus, rest, createItem, authentication } from '@directus/sdk';

const directus = createDirectus(process.env.DIRECTUS_URL!)
  .with(rest())
  .with(authentication('json'));

async function importSponsors() {
  for (const sponsor of sponsors) {
    await directus.request(createItem('sponsors', {
      name: sponsor.name,
      logo: sponsor.logo,
      website: sponsor.website,
      order: sponsor.id,
      status: 'published',
    }));
  }
  console.log('✅ Sponsors imported!');
}

importSponsors();
```

Run met: `npx tsx scripts/import-sponsors.ts`

## Vercel Deployment

De Remix app werkt out-of-the-box met Vercel:

1. Push je code naar GitHub
2. Ga naar [vercel.com](https://vercel.com)
3. Import je repository
4. Add environment variable:
   - `DIRECTUS_URL` = je Directus instance URL
5. Deploy!

De app zal automatisch fallback naar statische content als Directus niet bereikbaar is.

## Testing Locally

Om lokaal te testen met je Directus instance:

```bash
# In apps/web/.env
DIRECTUS_URL=https://your-directus-instance.com

# Start dev server
npm run dev
```

De homepage zal nu data ophalen van Directus!

## Benefits van deze Setup

✅ **Gratis**: Directus Cloud Community tier is 100% gratis
✅ **Geen code wijzigingen nodig**: Content editors kunnen alles via UI aanpassen
✅ **Image hosting**: Directus host je images automatisch
✅ **Versioning**: Directus tracks alle content changes
✅ **Multi-user**: Meerdere admins kunnen content beheren
✅ **API-first**: Ready voor mobile app of andere frontends
✅ **Fallback**: Werkt nog steeds met statische content als Directus down is

## Volgende Stappen

1. ✅ Kies een hosting optie (Directus Cloud recommended)
2. ✅ Maak collections aan in Directus admin
3. ✅ Zet permissions op "Public Read"
4. ✅ Importeer bestaande data
5. ✅ Add DIRECTUS_URL environment variable
6. ✅ Deploy naar Vercel!
