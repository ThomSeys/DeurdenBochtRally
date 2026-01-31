# Rally Zones Overzicht - Deur Den Bocht 2026

## Definitieve Rally Zones Configuratie

**Totaal aantal zones: 4**

### Zone Details

1. **Vlaamse Ardennen** (Order: 1)
   - ID: `vlaamse-ardennen`
   - Beschrijving: De vlaamse ardennen zoals ze zijn. Mooi, met heuvels & prachtige uitzichten!
   - Karakter: Heuvels en panoramische uitzichten

2. **Condroz** (Order: 2)
   - ID: `condroz`
   - Beschrijving: Ooit de Rally van de Condroz willen over doen?
   - Karakter: Historische rally route

3. **Ardennen - Ourthe Vallei** (Order: 3)
   - ID: `ardennen-ourthe`
   - Beschrijving: De Ourthe. Prachtig & oh zo aangenaam.
   - Karakter: Vallei en rivierroutes

4. **Hoge Venen** (Order: 4)
   - ID: `hoge-venen`
   - Beschrijving: De Hoge venen & zijn mooie bossen
   - Karakter: Bossen en natuurgebied

## Punten Systeem

### Nieuwe Berekening
- Alle 4 zones voltooid: **+30 bonus punten**
- 3 zones voltooid: **+10 bonus punten**

### Legacy Berekening
- Per zone: **15 punten**
- Alle 4 zones: **+20 bonus punten**

## Content Updates Uitgevoerd

### Codebase
- ✅ `/routes/_index.tsx` - 3 locaties geüpdatet naar "4 Rally Zones"
- ✅ `/lib/email.server.ts` - Email template geüpdatet
- ✅ `/lib/utils.ts` - Puntenberekening aangepast voor 4 zones
- ✅ `/lib/utils.ts` - Legacy zones array verkort naar 4 items (rz1-rz4)

### Sanity CMS
- ✅ Feature Card "8 Rally Zones" → "4 Rally Zones" (ID: 6ls5v56EbOuIS4pXHzPsdz)

## Verificatie Checklist

- [x] Sanity bevat exact 4 rally zones
- [x] Alle homepage referenties tonen "4 Rally Zones"
- [x] Email templates vermelden 4 zones
- [x] Puntenberekening werkt met 4 zones
- [x] Legacy code ondersteunt rz1 t/m rz4
- [x] Feature card in Sanity geüpdatet en gepubliceerd

## Database Schema

Zones worden opgeslagen in Sanity met type `rallyZone`:
- `_id`: Unique identifier (slug-based)
- `title`: Zone naam
- `order`: Volgorde nummer (1-4)
- `description`: Korte beschrijving
- `character`: Optioneel karakter/thema
- `secretCode`: Optioneel toegangscode
- `difficulty`: Optioneel moeilijkheidsgraad
- `estimatedDuration`: Optionele geschatte duur

## Toekomstige Updates

Als er ooit meer zones bijkomen:
1. Update `/lib/constants.ts` indien nodig
2. Update `/lib/utils.ts` puntenberekening
3. Update alle content referenties
4. Update database schema indien nodig
5. Test volledig het checkpointsysteem
