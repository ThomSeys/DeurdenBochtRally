# Sanity CMS Setup Guide - 100% GRATIS! 🎉

## Waarom Sanity?

✅ **Generous Free Tier:**
- 3 gebruikers
- 10,000 documents
- 5GB assets storage
- 1M API CDN requests/maand
- Unlimited API requests (non-CDN)

✅ **Features:**
- Realtime updates
- Image CDN met transformaties (resize, crop, format)
- GROQ query language (SQL-achtig)
- TypeScript support
- Portable Text (rich text editor)
- Custom React components in studio

---

## Step 1: Create Sanity Project

### Via Sanity CLI (Aanbevolen)

```bash
# Install Sanity CLI globally
npm install -g @sanity/cli

# Login to Sanity
sanity login

# Create new project
sanity init

# Beantwoord de vragen:
# ? Project name: deur-den-bocht-2026
# ? Use the default dataset configuration? Yes
# ? Project output path: ./sanity-studio
# ? Select project template: Clean project with no predefined schemas
# ? Package manager: npm
```

Dit maakt een nieuwe Sanity project aan en geeft je:
- **Project ID** (gebruik dit in je .env)
- **Dataset name** (meestal "production")
- Lokale studio in `./sanity-studio` directory

### Via Sanity.io Website

1. Ga naar [sanity.io](https://sanity.io)
2. Klik "Get started" (gratis)
3. Sign up met GitHub/Google
4. Klik "Create new project"
5. Project name: "Deur Den Bocht 2026"
6. Kopieer je **Project ID**

---

## Step 2: Setup Studio (Admin Interface)

### Install & Configure Studio

```bash
cd sanity-studio

# Install dependencies (if not done automatically)
npm install
```

### Create Schema

Maak deze schemas in `sanity-studio/schemaTypes/`:

#### `sponsor.ts`
```typescript
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'sponsor',
  title: 'Sponsor',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Sponsor Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      validation: (Rule) => Rule.required(),
      options: {
        hotspot: true, // Enables image cropping
      },
    }),
    defineField({
      name: 'website',
      title: 'Website URL',
      type: 'url',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
});
```

#### `siteConfig.ts`
```typescript
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'siteConfig',
  title: 'Site Configuration',
  type: 'document',
  fields: [
    defineField({
      name: 'eventName',
      title: 'Event Name',
      type: 'string',
      initialValue: 'Den Bochtenkoning Rally 2026',
    }),
    defineField({
      name: 'eventDate',
      title: 'Event Date',
      type: 'date',
      initialValue: '2026-05-16',
    }),
    defineField({
      name: 'eventLocation',
      title: 'Event Location',
      type: 'string',
      initialValue: 'Café Belami, Aalter',
    }),
    defineField({
      name: 'eventTagline',
      title: 'Event Tagline',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
    }),
    defineField({
      name: 'contactWhatsapp',
      title: 'WhatsApp Number',
      type: 'string',
    }),
    defineField({
      name: 'contactLocation',
      title: 'Contact Location',
      type: 'string',
    }),
    defineField({
      name: 'socialFacebook',
      title: 'Facebook URL',
      type: 'url',
    }),
    defineField({
      name: 'socialInstagram',
      title: 'Instagram URL',
      type: 'url',
    }),
    defineField({
      name: 'socialStrava',
      title: 'Strava Club URL',
      type: 'url',
    }),
  ],
});
```

#### `stat.ts`
```typescript
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'stat',
  title: 'Statistic',
  type: 'document',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon (emoji)',
      type: 'string',
      description: 'Gebruik een emoji, bv. 🏍️ 🗺️ 🌍',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
    }),
  ],
});
```

#### `pricingTier.ts`
```typescript
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'pricingTier',
  title: 'Pricing Tier',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Tier Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price (€)',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Lijst van features, één per regel',
    }),
    defineField({
      name: 'highlighted',
      title: 'Highlight this tier?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
    }),
  ],
});
```

#### `rallyZone.ts`
```typescript
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'rallyZone',
  title: 'Rally Zone',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Zone Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Zone Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
    }),
  ],
});
```

#### Update `index.ts`

```typescript
import sponsor from './sponsor';
import siteConfig from './siteConfig';
import stat from './stat';
import pricingTier from './pricingTier';
import rallyZone from './rallyZone';

export const schemaTypes = [
  sponsor,
  siteConfig,
  stat,
  pricingTier,
  rallyZone,
];
```

### Deploy Studio

```bash
cd sanity-studio

# Deploy studio to Sanity hosting (gratis!)
sanity deploy

# Je krijgt een URL zoals: https://your-project.sanity.studio
# Dit is je admin interface!
```

---

## Step 3: Add Content

1. Ga naar je studio URL: `https://your-project.sanity.studio`
2. Login met je Sanity account
3. Voeg content toe:

### Site Config (1x)
- Event Name: "Den Bochtenkoning Rally 2026"
- Event Date: 16-05-2026
- Etc...

### Stats (4x)
- Stat 1: label="Totale KM", value="500+", icon="🏍️", order=0
- Stat 2: label="Zones", value="8", icon="🗺️", order=1
- Stat 3: label="Landen", value="3", icon="🌍", order=2
- Stat 4: label="Snelweg KM", value="0", icon="🚫", order=3

### Pricing Tiers (2x)
- Tier 1: name="Met maaltijden", price=20, features=["Ontbijt", "Lunch", "Avondmaal"], highlighted=true
- Tier 2: name="Alleen ontbijt", price=10, features=["Ontbijt included"]

### Sponsors (8x)
- Upload logo's
- Vul namen en websites in
- Set order (0-7)

---

## Step 4: Configure Environment

### Get Sanity credentials

```bash
cd sanity-studio
sanity manage
# Opens browser with project settings
# Copy your Project ID
```

### Add to Remix .env

```bash
# apps/web/.env
SANITY_PROJECT_ID=abc123xyz
SANITY_DATASET=production
```

---

## Step 5: Test Integration

```bash
cd apps/web
npm run dev

# Visit http://localhost:5173
# Data should load from Sanity!
```

Als Sanity niet bereikbaar is, valt de app terug op statische content.

---

## Step 6: Deploy to Vercel

### Push to GitHub

```bash
git add .
git commit -m "feat: integrate Sanity CMS"
git push origin main
```

### Deploy op Vercel

1. Ga naar [vercel.com](https://vercel.com)
2. Import je GitHub repo
3. Root directory: `apps/web`
4. Add environment variables:
   ```
   SANITY_PROJECT_ID=abc123xyz
   SANITY_DATASET=production
   ```
5. Deploy!

---

## Image URLs

Sanity heeft een krachtige image CDN. In je Remix code:

```typescript
import { urlFor } from '~/lib/sanity.server';

// In je component:
const imageUrl = urlFor(sponsor.logo)
  .width(400)
  .height(200)
  .format('webp')
  .quality(80)
  .url();

// Of in JSX:
<img 
  src={urlFor(sponsor.logo).width(400).url()} 
  alt={sponsor.name}
/>
```

---

## API Limits (Free Tier)

- **Documents**: 10,000 (ruim genoeg!)
- **Assets**: 5GB (honderden afbeeldingen)
- **API CDN requests**: 1M/maand (300k/dag = meer dan genoeg)
- **Non-CDN API**: Unlimited!

Voor jullie site is dit meer dan voldoende!

---

## Content Management

### Add Content Editor

1. Ga naar [sanity.io/manage](https://sanity.io/manage)
2. Select je project
3. Ga naar "API" → "Tokens"
4. Klik "Add API token"
5. Geef naam: "Editor Token"
6. Permissions: "Editor"
7. Copy token en stuur naar content editor

Ze kunnen nu inloggen op `https://your-project.sanity.studio`

---

## Benefits

✅ **100% Gratis** voor jullie use case
✅ **Image CDN** met automatische optimalisatie
✅ **Realtime updates** - wijzigingen direct zichtbaar
✅ **TypeScript support** - type-safe queries
✅ **Versioning** - undo/redo functionaliteit
✅ **Multi-user** - 3 admins kunnen content beheren
✅ **Custom studio** - deploy je eigen admin interface
✅ **GROQ queries** - krachtige query language
✅ **Asset management** - drag & drop upload
✅ **Fallback** - werkt nog met statische content als backup

---

## Next Steps

1. ✅ Install Sanity CLI: `npm i -g @sanity/cli`
2. ✅ Create project: `sanity init`
3. ✅ Add schemas (copy/paste van hierboven)
4. ✅ Deploy studio: `sanity deploy`
5. ✅ Add content via studio
6. ✅ Add SANITY_PROJECT_ID to .env
7. ✅ Test locally: `npm run dev`
8. ✅ Deploy to Vercel with env vars
9. 🎉 Je bent live!

---

## Resources

- [Sanity Docs](https://www.sanity.io/docs)
- [GROQ Cheat Sheet](https://www.sanity.io/docs/query-cheat-sheet)
- [Image CDN Docs](https://www.sanity.io/docs/image-url)
- [Schema Reference](https://www.sanity.io/docs/schema-types)

**Veel beter dan Directus!** 🚀
