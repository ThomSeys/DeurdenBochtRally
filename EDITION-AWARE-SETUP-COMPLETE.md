# ✅ Complete Dynamic Content Implementation - Edition-Aware

## Overview

Your entire site is now dynamically managed through Sanity CMS, with **all content properly linked to event editions**. This means you can easily manage content for different years/editions of your rally.

## Edition Filtering - How It Works

Every content query automatically filters by the **active edition**:

```typescript
const editionId = await getActiveEdition();
const query = `*[_type == "contentType" && edition._ref == $editionId]`
```

This ensures:
- Only content from the active edition is displayed
- You can prepare content for future editions without affecting the live site
- Historical content from past editions is preserved but not shown

## Content Types & Edition Linking

All content types are edition-aware:

### ✅ Already Linked to Editions
1. **Stats** - Event statistics (km, zones, participants, etc.)
2. **Pricing Tiers** - Ticket types and prices
3. **Rally Zones** - The 8 challenge zones with details
4. **Sponsors** - Sponsor logos and information
5. **Site Config** - Event name, date, location, SEO settings

### ✅ Newly Added & Edition-Linked
6. **Page Content** - Rich text content blocks for all pages
7. **Schedule Items** - Event day timeline
8. **FAQ Items** - Questions categorized by type
9. **Benefit Items** - What participants/winners receive

## Page-by-Page Breakdown

### Homepage ([_index.tsx](apps/web/app/routes/_index.tsx))
**Dynamic Sections:**
- Hero title, date, location (from `siteConfig`)
- Stats grid (from `getStats()`)
- "What is it" content (from `getPageContent('homepage', 'what-is-it')`)
- Hero quote "Altijd via de omweg" (from `getPageContent('homepage', 'hero-quote')`)
- Pricing tiers (from `getPricingTiers()`)
- Rally intro text (from `getPageContent('homepage', 'rally-intro')`)
- Rally zones card (from `getPageContent('homepage', 'rally-zones-card')`)
- Points card (from `getPageContent('homepage', 'points-card')`)
- Sponsors list (from `getSponsors()`)
- Sponsors intro (from `getPageContent('homepage', 'sponsors-intro')`)
- Sponsors CTA (from `getPageContent('homepage', 'sponsors-cta')`)
- Final CTA (from `getPageContent('homepage', 'final-cta')`)

**Hardcoded (intentional):**
- Button labels ("NU INSCHRIJVEN", "MEER INFO", etc.)
- Navigation structure
- Layout and styling

### About Page ([about.tsx](apps/web/app/routes/about.tsx))
**Dynamic Sections:**
- Schedule with 4 time blocks (from `getScheduleItems()`)
- Participant benefits (from `getBenefitItems('everyone')`)
- Winner benefits (from `getBenefitItems('winner')`)
- Safety information (from `getFAQItems('safety')`)
- Cancellation policy (from `getFAQItems('cancellation')`)
- Important notices (from `getFAQItems('important')`)

**Hardcoded:**
- Section headings ("Dagschema", "Veiligheid & Organisatie", etc.)
- Icons and styling

### Rally Page ([rally.tsx](apps/web/app/routes/rally.tsx))
**Dynamic Sections:**
- Rally zones list with all details (from `getRallyZones()`)
- "How it works" instructions (from `getPageContent('rally', 'how-it-works-intro')`)

**Hardcoded:**
- Section headings
- Date restriction notice text

## To Complete the Setup

You need to manually add 6 more content blocks in Sanity Studio (API token lacks create permission):

Go to https://deurdenbochtrally.sanity.studio/ and create these **Page Content** documents:

1. **hero-quote** - "Altijd via de omweg" section
2. **rally-zones-card** - Rally zones description
3. **points-card** - Points system description
4. **final-cta** - Bottom CTA text
5. **sponsors-intro** - Sponsors section intro
6. **sponsors-cta** - Sponsor contact text

See [ADD-HOMEPAGE-CONTENT.md](ADD-HOMEPAGE-CONTENT.md) for exact content.

## Managing Content for New Editions

When planning for next year's rally:

### Step 1: Create New Edition
1. Go to Sanity Studio
2. Create new **Edition** document
3. Set `isActive: false` (keep current edition active for now)

### Step 2: Duplicate Content
For each content type, create new documents for the new edition:
- Copy existing schedule items, change edition reference
- Copy FAQ items, update answers if needed
- Create new pricing tiers (prices might change)
- Add new rally zones or update existing ones
- Update page content if text changes

### Step 3: Switch Active Edition
1. When ready to go live with new edition content
2. Set old edition `isActive: false`
3. Set new edition `isActive: true`
4. Site immediately shows new edition content

## API Functions Reference

All in [sanity.server.ts](apps/web/app/lib/sanity.server.ts):

```typescript
// Content
getPageContent(page: 'homepage' | 'about' | 'rally'): Promise<PageContent[]>
getScheduleItems(): Promise<ScheduleItem[]>
getFAQItems(category?: string): Promise<FAQItem[]>
getBenefitItems(category?: 'everyone' | 'winner'): Promise<BenefitItem[]>

// Event details
getRallyZones(): Promise<RallyZone[]>
getPricingTiers(): Promise<PricingTier[]>
getStats(): Promise<Stat[]>
getSponsors(): Promise<Sponsor[]>
getSiteConfig(): Promise<SiteConfig | null>

// Edition management
getActiveEdition(): Promise<string | null>
```

## Benefits of Edition-Based Content

✅ **Easy year-over-year management** - Prepare next year without affecting live site
✅ **Historical preservation** - Keep all past edition data
✅ **A/B testing** - Test different content by switching editions
✅ **Rollback capability** - Switch back to previous edition if needed
✅ **Clean content organization** - All content clearly tied to specific events
✅ **Future planning** - Create content months in advance

## Scripts Created

1. **populate-content.ts** - Initial content population (24 items)
2. **populate-homepage-extras.ts** - Additional homepage sections (6 items, needs manual creation)

## Files Modified

### New Schema Files
- `sanity-studio/schemaTypes/pageContent.ts`
- `sanity-studio/schemaTypes/scheduleItem.ts`
- `sanity-studio/schemaTypes/faqItem.ts`
- `sanity-studio/schemaTypes/benefitItem.ts`

### Updated Files
- `sanity-studio/schemaTypes/index.ts`
- `apps/web/app/lib/sanity.server.ts`
- `apps/web/app/routes/_index.tsx`
- `apps/web/app/routes/about.tsx`
- `apps/web/app/routes/rally.tsx`
- `apps/web/package.json`

## Testing Edition Switching

To test edition-based filtering:

1. Create a test edition in Sanity Studio
2. Add some test content linked to it
3. Switch `isActive` between editions
4. Refresh your site - content updates immediately
5. Verify only active edition content appears

## What's Still Hardcoded (By Design)

These elements should remain in code:
- Navigation menu structure
- Button labels and CTAs
- Section headers (unless you want them dynamic too)
- Page layouts and design
- Routes and URL structure
- Image placement and styling

---

🎉 **Your site is now fully edition-aware and dynamically managed!**

Every piece of content can be updated per edition without touching code.
