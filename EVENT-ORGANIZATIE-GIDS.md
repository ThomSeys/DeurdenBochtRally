# Bochtenkoning Rally - Organisatie Gids

**Editie 2026 | VZW Deur Den Bocht**

---

## 📋 Inhoudsopgave

1. [Event Concept](#event-concept)
2. [Doelgroep & Filosofie](#doelgroep--filosofie)
3. [Route & Formules](#route--formules)
4. [Technische Infrastructuur](#technische-infrastructuur)
5. [Timeline & Planning](#timeline--planning)
6. [Verantwoordelijkheden & Rollen](#verantwoordelijkheden--rollen)
7. [Communicatie & Marketing](#communicatie--marketing)
8. [Veiligheid & Noodprocedures](#veiligheid--noodprocedures)
9. [Financiën & Budgettering](#financiën--budgettering)
10. [Post-Event & Evaluatie](#post-event--evaluatie)

---

## 🏍️ Event Concept

### Wat is de Bochtenkoning Rally?

De Bochtenkoning Rally is een **community-gerichte motorrit rally** door de mooiste wegen van België, met focus op **vrijheid, avontuur en verhalen delen**. Het is geen race of competitie, maar een viering van het motorrijden en de gemeenschap eromheen.

### Core Principles

1. **Keuze & Vrijheid**: Deelnemers kiezen zelf hoe ze hun dag invullen
2. **Community First**: Het gaat om verbinding, niet om winnen
3. **Verhalen Delen**: Foto's en ervaringen zijn belangrijker dan punten
4. **Veiligheid**: Veilig rijden, op eigen tempo, geen tijdsdruk
5. **Toegankelijkheid**: Voor elk niveau en rijstijl

### Event Identiteit

- **Naam**: Bochtenkoning Rally 2026
- **Datum**: 8 augustus 2026
- **Locatie**:
  - Start: Café Den Belami (06:30 - 08:00)
  - Finish: Baraque de Fraiture (17:00 - 20:30)
- **Deelnemers**: Max. 50-100 rijders
- **Type**: Zelfstandige rally met optionele checkpoints

---

## 👥 Doelgroep & Filosofie

### Primaire Doelgroep

- **Motorrijders** van alle niveaus (18+)
- **Avonturiers** die willen ontdekken en navigeren
- **Community builders** die verhalen willen delen
- **Solo riders & groepen** beide welkom
- **Toeristen & locals** gemengd publiek

### Filosofie Shift (2026)

#### Van Competition naar Community

- ✅ Keuze tussen 2 route-opties
- ✅ Optionele rally zone check-ins
- ✅ Focus op foto's en verhalen delen
- ✅ Community gallery & story sharing
- ✅ Iedereen is een "bocht-held"
**Totale Afstand**: ~350-450 km door de Ardennen

**Start & Finish:**

- **Start**: Café Den Belami (Oost-Vlaanderen)
- **Tussenhalte**: Lunch optie in Ardennen (11:30-14:30)
- **Finish**: Baraque de Fraiture (hoogste punt van België)

### Twee Formules

#### 1. Adventure Track (met Rally Zones & Routetips)

**Voor wie:**

- Avonturiers die willen navigeren
- Mensen die hun eigen route willen samenstellen
- Deelnemers die volledig willen beleven

**Kenmerken:**

- Meerdere rally zones verspreid over de hoofdroute
- Per zone: verschillende routetips (off-road, technisch, panoramisch, snelweg, binnendoor, ...)
- Volledig optioneel - kies waar je zin in hebt
- Geen verplichte check-ins of checkpoints
- GPX beschikbaar per tip (optioneel)

**Materialen:**

- Klassiek roadbook (papier) met rally zones & routetips
- Digital GPX per tip (optioneel)
- Overzichtskaart met alle zones & tip karakteristieken

#### 2. Complete Route (Cruise Mode)

**Voor wie:**

- Rijders die gewoon willen cruisen
- Mensen zonder druk van checkpoints
- Deelnemers die alleen de mooie wegen willen

**Kenmerken:**

- Eén doorlopende GPX route
- Geen verplichte stops
- Volledige vrijheid
- Optioneel: alsnog zones bezoeken

**Materialen:**

- Complete route GPX
- Roadbook (optioneel)
- Algemene route kaart

### Rally Zones & Routetips

Elke rally zone bevat meerdere routetips waar deelnemers uit kunnen kiezen:

**Rally Zone structuur:**

- **Naam**: Beschrijvende titel van de zone
- **Locatie**: Waar bevindt deze zone zich (bijv., "Vlaamse Ardennen")
- **Beschrijving**: Algemene beschrijving van de zone

**Routetip eigenschappen (per tip binnen een zone):**

- **Naam**: Beschrijvende titel van de specifieke route
- **Type**: Off-road / Technisch / Panoramisch / Snelweg / Binnendoor / Gemengd
- **Beschrijving**: Wat maakt deze route bijzonder?
- **Startpunt**: Waar verlaat je de hoofdroute (landmark + instructies)
- **Route instructies**: Gedetailleerde beschrijving van de route
- **Eindpunt**: Waar kom je terug op de hoofdroute
- **Afstand**: Geschatte kilometers omweg
- **Karakter**: Bochtig / Rustig / Druk / Technisch / Vlak
- **Moeilijkheidsgraad**: Easy / Medium / Hard
- **Aandachtspunten**: Gravel, verkeer, smalle wegen, etc.
- **Highlights**: Scenic points, foto spots, aanraders
- **GPX**: Optioneel downloadbaar bestand

---

## 💻 Technische Infrastructuur

### Online Platform (React Router + Remix)

#### Publieke Website

- Homepage met event intro
- Rally zones overzicht
- About page met filosofie
- FAQ & veiligheid info
- Registratie formulier

#### Participant Dashboard

- Persoonlijke QR code
- Route preference keuze (bij registratie)
- GPX downloads (per zone of volledig)
- Rally zone check-in (voor Adventure Track users)
- Foto upload & gallery toegang
- Achievement tracking (optioneel)
- Blog/verhalen schrijven

#### Admin Dashboard

- Check-in controle (QR scanner)
- Live map met participant locaties
- Emergency SOS monitoring
- Push notifications versturen
- Event markers plaatsen
- Zone control (activeren/deactiveren)
- Gallery moderation
- Participant management

### Database (Supabase PostgreSQL)

**Core Tables:**

```text
participants:
  - id, email, naam, motor details
  - route_preference (rally_zones | complete_route)
  - qr_code, checked_in, payment_status
  - allow_location_sharing, bio, photo

rally_zone_checkins:
  - participant_id, rally_zone_id
  - action (manual_checkin | qr_scan)
  - latitude, longitude, checked_at

photos:
  - participant_id, url, caption
  - likes_count, approved

blog_posts:
  - participant_id, title, content
  - published, created_at

emergency_sos_alerts:
  - participant_id, latitude, longitude
  - status (active | resolved), created_at
```

### CMS (Sanity)

**Document Types:**

- `edition`: Event editie configuratie
- `rallyZoneV2`: Rally zone details met GPX
- `benefitItem`: Voordelen van deelname
- `scheduleItem`: Dagprogramma
- `faqItem`: Veelgestelde vragen
- `eventStory`: Over het event content
- `siteConfig`: Algemene configuratie

### Features Technologie

1. **QR Code Systeem**
   - Unieke QR per participant
   - Check-in bij start
   - Zone check-ins (optioneel)

2. **Geolocation Services**
   - Live map met participant markers
   - 100m radius validatie voor check-ins
   - Emergency location tracking

3. **Push Notifications**
   - Web push (service worker)
   - Emergency broadcasts
   - Route updates

4. **Offline Capabilities**
   - Service worker cache
   - GPX downloads
   - Fallback photos

5. **Emergency SOS**
   - One-tap noodknop
   - GPS coördinaten naar organisatie
   - Automatische notificatie admin

---

## 📅 Timeline & Planning

### Pre-Event (T-6 maanden tot T-1 week)

#### T-6 maanden: Concept & Route

- Route bepalen en testen
- Rally zones selecteren
- GPX files creëren
- Roadbook design

#### T-4 maanden: Marketing Launch

- Website live
- Social media campagne starten
- Inschrijvingen openen
- Sponsoren contacteren

#### T-2 maanden: Logistics

- Start/finish locaties boeken
- Lunch locatie regelen
- Verzekeringen afsluiten
- Safety briefing voorbereiden

#### T-1 maand: Finaliseren

- QR codes genereren
- Participant pakketjes voorbereiden
- Emergency procedures testen
- Admin team briefen

#### T-1 week: Final Checks

- Alle deelnemers bevestigen
- Weersvoorspelling checken
- Materialen inladen
- Noodcontacten delen

### Event Day (8 augustus 2026)

#### 06:00 - Setup

- Start locatie inrichten
- Check-in tafels klaarzetten
- Admin tablets/laptops ready
- Ontbijt setup

#### 06:30-08:00 - Check-in

- QR codes scannen
- Startnummers uitdelen
- Roadbooks uitdelen
- Safety briefing (07:30)
- Groepsfoto (07:45)

#### 08:00-17:00 - Rally

- Live monitoring dashboard
- WhatsApp groep actief
- Emergency standby
- Push notifications indien nodig

#### 17:00-20:30 - Finish

- Check-in bij aankomst
- Eten & drinken
- Foto's verzamelen
- Verhalen delen sessie (21:00)

#### 21:00-23:00 - Community Time

- Verhalen presentaties
- Gallery showcase op groot scherm
- Dank je wel speech
- Groepsfoto finish

### Post-Event (T+1 dag tot T+1 maand)

#### T+1 dag: Debrief

- Team evaluatie meeting
- Emergency incidents review
- Quick wins / pain points

#### T+1 week: Data Processing

- Alle foto's uploaden naar gallery
- Blogs publiceren
- Financiën afronden
- Bedankjes naar sponsors

#### T+1 maand: Archive

- Event video/recap maken
- Testimonials verzamelen
- Lessons learned document
- Next edition planning starten

---

## 👔 Verantwoordelijkheden & Rollen

### Organisatie Team (VZW)

#### Event Director (1 persoon)

**Taken:**

- Algemene leiding en beslissingen
- Contact met locaties en leveranciers
- Budget beheer
- Finale verantwoordelijkheid

**Skills:**

- Project management
- Leiderschapservaring
- Stressbestendig

#### Route Coördinator (1-2 personen)

**Taken:**

- Route design en testen
- GPX files creëren
- Rally zones selecteren en documenteren
- Roadbook ontwerp

**Skills:**

- Ervaring met motorroutes
- GPS/GPX kennis
- Creatief met navigatie

#### Tech Lead (1 persoon)

**Taken:**

- Website/platform beheer
- Database configuratie
- Bug fixes tijdens event
- Emergency SOS systeem

**Skills:**

- Web development (React/Remix)
- Database kennis
- 24/7 beschikbaarheid event day

#### Marketing & Communicatie (1-2 personen)

**Taken:**

- Social media management
- Content creatie (foto's, video's)
- Deelnemers communicatie
- Sponsor relaties

**Skills:**

- Social media ervaring
- Copywriting
- Fotografie/videografie

#### Logistics Coördinator (1 persoon)

**Taken:**

- Materialen inkoop en transport
- Check-in setup
- Eten & drinken regelen
- Toiletten, parking, etc.

**Skills:**

- Organisatorisch sterk
- Praktisch ingesteld
- Leveranciers management

#### Safety Officer (1-2 personen)

**Taken:**

- Safety briefing presenteren
- Emergency procedures
- EHBO standby
- Incident management

**Skills:**

- EHBO diploma (vereist)
- Kalm onder druk
- Motorrijervaring

### Vrijwilligers (8-12 personen)

#### Check-in Team (4 personen)

- QR codes scannen
- Pakketjes uitdelen
- Vragen beantwoorden

#### Finish Team (3 personen)

- Check-in registratie
- Eten & drinken serveren
- Foto's maken

#### Road Marshals (3-4 personen)

- Strategische punten bemensen
- Hulp bij pech/vragen
- Emergency backup

#### Media Team (1-2 personen)

- Event fotografie
- Video opnames
- Social media live updates

---

## 📢 Communicatie & Marketing

### Pre-Event Marketing

#### Content Pilaren

1. **Route & Adventure**: Mooie wegen, zones preview
2. **Community**: Testimonials, vorige edities
3. **Practical**: Info, FAQ, tips
4. **Behind the Scenes**: Organisatie, route testen

#### Kanalen

- **Website**: Primary info source
- **Facebook**: Event page + groep
- **Instagram**: Visual storytelling
- **Email**: Nieuwsbrieven naar deelnemers
- **WhatsApp**: Emergency & updates (event day)

#### Content Planning

**T-4 maanden**: Launch announcement
**T-3 maanden**: Route preview, early bird deadline
**T-2 maanden**: Rally zones spotlight series
**T-1 maand**: Practical info, safety tips
**T-1 week**: Final info, weather, meet & greet

### During Event Communicatie

**WhatsApp Groep:**

- Enkel voor noodgevallen en belangrijke updates
- Admin team + safety officers
- Geen spam/social

**Push Notifications:**

- Welkom bericht bij start
- Belangrijke waarschuwingen (weer, verkeer)
- Finish reminder

**Live Social Media:**

- Instagram stories van checkpoints
- Facebook updates met foto's
- Real-time community engagement

### Post-Event Communicatie

**Week 1:**

- Bedank je wel bericht
- Gallery link delen
- Blog posts promoten
- Survey versturen

**Week 2-4:**

- Recap video publiceren
- Best photos showcase
- Lessons learned transparant delen
- Save the date volgende editie

---

## 🚨 Veiligheid & Noodprocedures

### Pre-Event Safety

#### Participant Requirements

- Geldig rijbewijs (A categorie)
- Geldige motorverzekering
- Motor in goede technische staat
- Helm + beschermende kledij verplicht

#### Safety Briefing (07:30)

**Topics:**

1. Event is geen race - rustig rijden
2. Verkeersregels blijven gelden
3. Eigen tempo, geen groepsdruk
4. Emergency SOS knop uitleg
5. Noodcontacten delen
6. Weersvoorspelling
7. Gevaarlijke punten op route

### Emergency Procedures

#### Emergency SOS Systeem

**Hoe werkt het:**

1. Deelnemer drukt SOS knop in app
2. GPS coördinaten + naam naar admin dashboard
3. Automatische push notificatie naar safety officers
4. Phone call naar participant (status check)
5. Indien nodig: 112 bellen + road marshal sturen

**Response Team:**

- Safety Officer (coördinator)
- 2 Road Marshals met motor (mobiel)
- Admin met live tracking dashboard

#### Emergency Categories

##### Level 1: Minor (Pech/Verdwaald)

- Response: Road marshal naar locatie
- Timeline: 15-30 minuten
- Follow-up: Hulp ter plaatse of tow truck

##### Level 2: Moderate (Valpartij zonder letsel)

- Response: Safety officer + road marshal
- Timeline: 10-20 minuten
- Follow-up: Medische check, incident rapport

##### Level 3: Critical (Valpartij met letsel)

- Response: 112 direct bellen
- Action: Safety officer naar locatie, traffic control
- Timeline: Ambulance ASAP
- Follow-up: Hospital contact, familie informeren

#### Communication Protocol

1. **Participant → SOS button → Admin dashboard**
2. **Admin → Phone call participant (assess severity)**
3. **Admin → Notify response team (WhatsApp + phone)**
4. **Response team → Navigate to location (live GPS)**
5. **On-site → Status update to admin**
6. **Resolution → Incident report + family contact**

### Medical Support

**Standby Team:**

- EHBO-er bij start (06:30-08:30)
- EHBO-er bij finish (16:00-21:00)
- Road marshals met EHBO kit

**Hospital Contacts:**

- Route hospitals lijst in admin dashboard
- Emergency contact numbers ready

---

## 💰 Inschrijvingsformules

**Deelname opties:**

- **Basisdeelname**: €15 (motor + rijder, zonder maaltijden)
- **All-in pakket**: €25 (motor + rijder + middag- en avondeten)

---

## 📊 Post-Event & Evaluatie

### Debrief Meeting (T+1 dag)

**Agenda:**

1. General impressions (quick round)
2. Safety incidents review
3. Tech issues & platform performance
4. Participant feedback themes
5. Financial quick look
6. Top 3 successes
7. Top 3 improvements
8. Action items for next edition

**Attendees:**

- Full organisatie team
- Key vrijwilligers
- Optional: 2-3 deelnemers

### Participant Survey (T+3 dagen)

**Key Questions:**

1. Overall satisfaction (1-10)
2. Route quality & difficulty
3. Rally zones experience (Adventure Track users)
4. Complete route experience (Cruise Mode users)
5. Check-in proces
6. Safety & organization
7. Value for money
8. Would recommend to friends?
9. What to improve?
10. Suggestions for next edition

**Distribution:**

- Email to all participants
- Response incentive: Early bird discount next year
- Target: 60%+ response rate

### Data Analysis (T+1 week)

**Metrics to Track:**

- Total participants: X/150
- Route preference split: X% Adventure / Y% Complete
- Average zones visited: X/8
- Photo uploads: X photos
- Blog posts: X stories
- Emergency incidents: X (severity breakdown)
- Survey satisfaction: X/10 average
- Financial: €X profit/loss

### Report Document (T+2 weeks)

**Contents:**

1. Executive summary
2. Event statistics
3. Financial overview
4. Participant feedback analysis
5. Safety & incidents
6. What went well
7. What to improve
8. Recommendations for next edition
9. Appendices (photos, data, etc.)

**Distribution:**

- VZW board
- Sponsors
- Key stakeholders
- Archive for planning 2027

### Community Follow-up (T+1 maand)

**Actions:**

1. Publish event recap video
2. Showcase best photos on website
3. Feature participant stories
4. Thank sponsors publicly
5. Share lessons learned transparently
6. Tease next edition date

---

## 🎯 Success Metrics

### Quantitative

- ✅ 150+ participants registered
- ✅ 60%+ survey satisfaction (>8/10)
- ✅ 0 serious safety incidents
- ✅ Budget break-even or profit
- ✅ 80%+ check-in rate at start
- ✅ 100+ photo uploads
- ✅ 20+ blog stories

### Qualitative

- ✅ Positive social media sentiment
- ✅ Participant testimonials
- ✅ Sponsor satisfaction
- ✅ Community engagement
- ✅ Team morale & learning
- ✅ Legacy for next editions

---

## 📝 Checklist Master

### 6 Maanden Voor Event

- [ ] Route design & testing
- [ ] Rally zones selected
- [ ] Website development
- [ ] Budget planning
- [ ] Sponsorship proposal

### 4 Maanden Voor Event

- [ ] Website live & registratie open
- [ ] Social media campaign launch
- [ ] Locaties geboekt (start/finish/lunch)
- [ ] Insurance arranged
- [ ] Sponsoren gecontacteerd

### 2 Maanden Voor Event

- [ ] Marketing full steam
- [ ] Roadbook design finalized
- [ ] GPX files tested
- [ ] Admin team recruited
- [ ] Vrijwilligers confirmed

### 1 Maand Voor Event

- [ ] QR codes generated
- [ ] Participant pakketjes ready
- [ ] Safety procedures documented
- [ ] Emergency contacts list
- [ ] Final participant count

### 1 Week Voor Event

- [ ] Weather check
- [ ] All materials packed
- [ ] Final team briefing
- [ ] WhatsApp groep created
- [ ] Test all tech systems

### Event Day

- [ ] Setup complete by 06:00
- [ ] Check-in 06:30-08:00
- [ ] Safety briefing 07:30
- [ ] Rally start 08:00
- [ ] Live monitoring active
- [ ] Finish reception 17:00-20:30
- [ ] Community time 21:00

### Post-Event

- [ ] Debrief meeting T+1
- [ ] Survey sent T+3
- [ ] Data analyzed T+1 week
- [ ] Report created T+2 weeks
- [ ] Community follow-up T+1 month
- [ ] Archive & lessons learned

---

## 🔗 Belangrijke Links & Contacten

### Platforms

- Website: <https://deur-den-bocht.be>
- Admin Dashboard: <https://deur-den-bocht.be/admin>
- Sanity CMS: <https://deur-den-bocht.sanity.studio>

### Emergency Contacts

- **112**: General emergency
- **Safety Officer**: [GSM nummer]
- **Event Director**: [GSM nummer]
- **Tech Lead**: [GSM nummer] (24/7)

### Leveranciers

- **Start locatie**: Café Den Belami - [contact]
- **Finish locatie**: Baraque de Fraiture - [contact]
- **Verzekering**: [bedrijf + contact]
- **Catering**: [bedrijf + contact]

### Support

- **Tech issues**: <tech@deur-den-bocht.be>
- **General info**: <info@deur-den-bocht.be>
- **Emergency**: 112 + [safety officer GSM]

---

## 📄 Legal & Disclaimers

### Participant Agreement

Elke deelnemer accepteert bij inschrijving:

1. **Eigen Risico**: Deelname volledig op eigen risico
2. **Verzekering**: Geldige WA motorverzekering verplicht
3. **Verkeersregels**: Blijven te allen tijde gelden
4. **Geen Race**: Event is geen snelheidscompetitie
5. **Foto's**: Akkoord met publicatie event foto's
6. **Gegevens**: Privacy policy GDPR-compliant
7. **Terugbetaling**: Tot 5 dagen voor event mogelijk
8. **Wijzigingen**: Organisatie behoudt recht op aanpassingen

### VZW Verantwoordelijkheden

**Wij zorgen voor:**

- Veilige route planning
- Duidelijke communicatie
- Emergency procedures
- EHBO aanwezig
- Liability verzekering

**Wij zijn NIET verantwoordelijk voor:**

- Schade aan voertuigen
- Persoonlijk letsel
- Verlies/diefstal persoonlijke spullen
- Verkeersboetes
- Weersomstandigheden

---

## 🚀 Vision voor Toekomst

### Editie 2027 Ideeën

- International expansion (NL/FR/DE riders)
- Multi-day event optie
- Camping/overnight bij finish
- Partnerships met motorbedrijven
- Mobile app (native iOS/Android)
- Live tracker voor familie/vrienden
- Charity component (goede doel)

### Long-term Vision (2026-2030)

- **Jaar 1-2**: Establish reputation (150-200 riders)
- **Jaar 3-4**: Grow to 300+ riders, multi-day
- **Jaar 5**: International recognition, signature event
- **Community**: Year-round meetups, rides, training
- **Brand**: Bochtenkoning Rally = synonymous met adventure riding

---

**Document Version:** 1.0  
**Datum:** 27 januari 2026  
**Auteur:** VZW Deur Den Bocht Organisatie Team  
**Status:** Living Document (updates doorlopend)

---

*Voor vragen of suggesties over deze gids, contacteer de Event Director of stuur een email naar <info@deur-den-bocht.be>*
