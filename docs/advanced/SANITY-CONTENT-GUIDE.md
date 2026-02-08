# Sanity Content Management Guide

## Overview
The website now fetches all content from Sanity CMS using the `pageContent` schema. This allows you to manage all text content without touching code.

## How It Works

### pageContent Schema
Content is organized by:
- **page**: Which page the content belongs to (e.g., 'homepage', 'about', 'rally')
- **section**: Which section of the page (e.g., 'hero', 'cta', 'what-is-it')
- **title**: The heading/title for that section
- **content**: Rich text content using Portable Text
- **order**: Display order (lower numbers appear first)

## Homepage Content Sections

### 1. Hero Section
- **Page**: `homepage`
- **Section**: `hero`
- **Title**: Main headline (e.g., "DEUR DEN BOCHT\nRALLY 2026")
- **Content**: Not used (date comes from edition)

### 2. CTA Section
- **Page**: `homepage`
- **Section**: `cta`
- **Title**: Call to action heading (e.g., "GADE MEE?")
- **Content**: Subheading text (e.g., "TOT AAN CAFÉ DEN BELAMI, AALTER!")

### 3. What Is It Section
- **Page**: `homepage`
- **Section**: `what-is-it`
- **Title**: Section heading (e.g., "Wat is Deur Den Bocht?")
- **Content**: Rich text with:
  - Introduction paragraph
  - Bullet list of features (use bullet list in Portable Text editor)
  - Closing statement

**Example Content Structure:**
```
Deur den Bocht – The 500 is een **all-day challenge ride** waar je 500+ kilometer rijdt door België, Noord-Frankrijk en de Ardennen.

- Je rijdt **500+ km** via de mooiste bochten
- Je **vertrekt wanneer jij wil**
- Je **stopt wanneer jij wil**
- Iedereen rijdt dezelfde prachtige **bochten-GPX**
- Onderweg kan je **optioneel deelnemen aan 8 Rally Zones**

Aan het einde van de dag kronen we: **🏆 DEUR DEN BOCHT CHAMPION**
```

### 4. Rally Info Section
- **Page**: `homepage`
- **Section**: `rally-info`
- **Title**: Section heading (e.g., "Het Bochtenboek & De Rally")
- **Content**: Description paragraph (e.g., "Onderweg kan je deelnemen aan **8 Rally Zones**...")

## How to Add Content to Sanity

### Via Sanity Studio UI
1. Go to your Sanity Studio (typically at http://localhost:3333 or your deployed studio)
2. Navigate to "Page Content"
3. Click "Create new Page Content"
4. Fill in:
   - **Page**: Select 'homepage' (or other page)
   - **Section**: Enter the section identifier (hero, cta, what-is-it, rally-info)
   - **Title**: Enter the heading text
   - **Content**: Use the rich text editor to add content
     - Use **bold** for emphasis
     - Use bullet lists for features
     - Add links as needed
   - **Order**: Set the display order (e.g., 10, 20, 30, 40)
   - **Edition**: Link to the active edition
5. Click "Publish"

### Via API/Script
You can also use the import script to populate content:

```bash
npm run populate-content
```

## Fallback Content
If no content exists in Sanity for a section, the website will display hardcoded fallback content. This ensures the site always works, even during initial setup.

## PortableText Formatting

The website uses a custom PortableText component that renders:
- **H1**: Large page headings (uppercase)
- **H2**: Section headings
- **H3**: Subsection headings
- **Paragraphs**: Regular text with proper spacing
- **Bold text**: Emphasized in dark gray
- **Bullet lists**: With checkmark icons
- **Links**: In primary color with underline

## Testing Your Content
1. Add content to Sanity Studio
2. Publish the content
3. Refresh your website
4. The new content should appear immediately

## Other Dynamic Content

### Already Using Sanity:
- ✅ **Stats** - Number cards (8 zones, 500+ km, etc.)
- ✅ **Pricing Tiers** - Registration options with prices
- ✅ **Sponsors** - Sponsor logos and links
- ✅ **Rally Zones** - Map zones with details
- ✅ **Schedule** - Timeline of the event day
- ✅ **FAQ** - Frequently asked questions
- ✅ **Benefits** - What participants get

### Still Hardcoded:
- Rally Zone feature cards (🗺️, 📕, 🏆)
- Header/Footer structure
- Form layouts

## Next Steps
1. Open Sanity Studio
2. Create pageContent entries for homepage sections
3. Expand to other pages (about, rally) as needed
4. Keep content updated through Sanity instead of code changes
