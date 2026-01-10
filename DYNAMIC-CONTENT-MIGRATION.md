# Dynamic Content Migration to Sanity CMS

## Overview
All hardcoded content across the website has been identified and new Sanity schema types have been created to make the entire site dynamically manageable through Sanity Studio.

## New Schema Types Created

### 1. **Page Content** (`pageContent`)
Generic content sections for any page.

**Fields:**
- `page`: Which page this belongs to (homepage, about, rally)
- `section`: Unique identifier (e.g., "what-is-it", "hero-subtitle")
- `title`: Section title
- `content`: Rich text content (Portable Text)
- `order`: Display order
- `edition`: Reference to edition

**Use Cases:**
- "What is Deur Den Bocht?" section on homepage
- Rally info cards on homepage
- About page text sections

### 2. **Schedule Items** (`scheduleItem`)
Event schedule with time slots and descriptions.

**Fields:**
- `time`: Time range (e.g., "06:30 - 08:00")
- `title`: Activity title
- `description`: Main description
- `icon`: Emoji icon
- `color`: Border color (primary, blue, green, yellow, red)
- `details`: Array of bullet points
- `order`: Display order
- `edition`: Reference to edition

**Use Cases:**
- Event day schedule on about page

### 3. **FAQ Items** (`faqItem`)
Frequently asked questions and important information.

**Fields:**
- `question`: The question or title
- `answer`: The answer or details
- `category`: general, safety, rally, cancellation, important
- `icon`: Optional emoji
- `order`: Display order
- `edition`: Reference to edition

**Use Cases:**
- Safety information
- Cancellation policy
- Important notices
- General FAQ sections

### 4. **Benefit Items** (`benefitItem`)
What participants receive.

**Fields:**
- `title`: Benefit title
- `description`: Benefit description
- `icon`: Emoji icon
- `category`: everyone or winner
- `order`: Display order
- `edition`: Reference to edition

**Use Cases:**
- What every participant receives
- What the winner receives

## Content to Add in Sanity Studio

### Schedule Items (for About Page)
Create these schedule items:

1. **Start bij Café Den Belami**
   - Time: "06:30 - 08:00"
   - Icon: "🌅"
   - Color: "primary"
   - Details: ["Inschrijving & polsbandje", "Ontbijt (koffie, koffiekoek, fruitsap)", "Bochtenboek", "QR-code naar GPX-route, Google Maps backup, WhatsApp groep", "Rallykaart"]

2. **Lunch**
   - Time: "11:30 - 14:30"
   - Icon: "🍽"
   - Color: "blue"

3. **Finish bij Baraque de Fraiture**
   - Time: "17:00 - 20:30"
   - Icon: "🏁"
   - Color: "green"

4. **Den Bochtenkoning**
   - Time: "21:00"
   - Icon: "🏆"
   - Color: "yellow"

### Benefit Items
**Category: everyone**
- Deur den Bocht – editie-sticker
- Digitale persoonlijke Rallykaart
- Toegang tot fotoalbum
- Bochtenboek met alle rally zones

**Category: winner**
- Den Bochtenkoning-trofee
- Speciale winnaar sticker
- Plaats op de Wall of Fame

### FAQ Items
**Category: safety**
- Noodnummer via QR
- WhatsApp groep
- Eigen risico
- Geen snelheid, geen tijdsklassement

**Category: cancellation**
- Overdraagbaar
- Terugbetaling beleid

**Category: important**
- Voorinschrijving verplicht
- Beperkte plaatsen
- Geldig rijbewijs en verzekering
- Motor in goede staat

### Page Content (Homepage)
**Page: homepage, Section: "what-is-it"**
- Title: "WAT IS DEUR DEN BOCHT?"
- Content: Main description text about the event

**Page: homepage, Section: "rally-intro"**
- Title: "HET BOCHTENBOEK & DE RALLY"
- Content: Rally introduction text

**Page: rally, Section: "how-it-works"**
- Title: "Hoe werkt een Rally Zone?"
- Content: Step-by-step instructions (currently hardcoded as numbered list)

**Page: rally, Section: "points-system"**
- Title: "Puntensysteem"
- Content: Points breakdown (currently hardcoded as table)

## API Functions Available

All new functions have been added to `sanity.server.ts`:

```typescript
// Get page-specific content
await getPageContent('homepage')
await getPageContent('about')
await getPageContent('rally')

// Get schedule items
await getScheduleItems()

// Get FAQ items (all or by category)
await getFAQItems()
await getFAQItems('safety')
await getFAQItems('cancellation')

// Get benefits (all or by category)
await getBenefitItems()
await getBenefitItems('everyone')
await getBenefitItems('winner')
```

## Next Steps

1. ✅ Schema types created and deployed
2. ⏳ Add content in Sanity Studio for each new content type
3. ⏳ Update page components to fetch and display content from Sanity
4. ⏳ Remove hardcoded content from page files
5. ⏳ Test all pages to ensure dynamic content displays correctly

## Benefits

- **Fully Dynamic**: Every aspect of the site can be edited through Sanity Studio
- **Edition-Specific**: All content is tied to an edition, making it easy to manage multiple years
- **Structured**: Content is organized by type, making it easy to find and edit
- **Flexible**: Rich text support for complex content, simple fields for basic data
- **Maintainable**: Non-technical users can update all website content without touching code
