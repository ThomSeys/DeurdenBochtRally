# Add Remaining Homepage Content to Sanity

Since the API token doesn't have create permissions, please add these content blocks manually in your Sanity Studio at https://deurdenbochtrally.sanity.studio/

## Content to Add

Go to "Page Content" in Sanity Studio and create the following 6 new documents:

### 1. Hero Quote Section
- **Page**: Homepage
- **Section**: `hero-quote`
- **Title**: `Altijd via de omweg.`
- **Content**: 
  ```
  ✓ Geen snelweg
  ✓ Geen GPS-pijltjes  
  ✓ Geen stress
  = Pure rijvreugde
  ```
- **Order**: 4
- **Edition**: Link to active edition

### 2. Rally Zones Card
- **Page**: Homepage
- **Section**: `rally-zones-card`
- **Title**: `8 Rally Zones`
- **Content**: `Optionele lusjes van de hoofdroute. Volg de beschrijving, vind het checkpunt, noteer de code.`
- **Order**: 5
- **Edition**: Link to active edition

### 3. Points Card
- **Page**: Homepage
- **Section**: `points-card`
- **Title**: `Punten verdienen`
- **Content**: `Elke zone = 15 punten. Alle 8 = +20 bonus. Wie het best scoort wordt "Den Bochtenkoning"!`
- **Order**: 6
- **Edition**: Link to active edition

### 4. Final CTA
- **Page**: Homepage
- **Section**: `final-cta`
- **Title**: `KLAAR VOOR HET AVONTUUR?`
- **Content**: `Schrijf je nu in en zorg dat je erbij bent!`
- **Order**: 7
- **Edition**: Link to active edition

### 5. Sponsors Intro
- **Page**: Homepage
- **Section**: `sponsors-intro`
- **Title**: `ONZE SPONSORS`
- **Content**: `Dit evenement wordt mede mogelijk gemaakt door:`
- **Order**: 8
- **Edition**: Link to active edition

### 6. Sponsors CTA
- **Page**: Homepage
- **Section**: `sponsors-cta`
- **Title**: `Interesse om sponsor te worden?`
- **Content**: `Neem contact met ons op via info@deurdenbocht.be`
- **Order**: 9
- **Edition**: Link to active edition

## Why These Sections?

These are the remaining hardcoded text blocks on the homepage that should be dynamically manageable:

- **Hero quote**: The "Altijd via de omweg" quote with bullet points
- **Rally cards**: The descriptions of the rally zones and points system
- **Final CTA**: The bottom call-to-action text
- **Sponsors sections**: Intro text and contact CTA

Once you add these in Sanity Studio, the homepage will automatically display them. The code is already updated to fetch and use this content!

## Already Dynamic ✅

These sections are already pulling from Sanity:
- "What is it" section (`what-is-it`)
- Rally introduction (`rally-intro`)
- Event stats
- Pricing tiers
- Rally zones preview
- Sponsors list
- Site configuration (date, location, etc.)
