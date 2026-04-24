# Build Scope — Deur Den Bocht 2026 Web App

> Written: 23 April 2026  
> Audience: developers and non-technical stakeholders  
> Status: work-in-progress foundation, scope below is outstanding

---

## Table of Contents

1. [CMS Integration (Sanity)](#1-cms-integration-sanity)
2. [Public Pages — Homepage & About](#2-public-pages--homepage--about)
3. [Content Block System](#3-content-block-system)
4. [Participant Dashboard](#4-participant-dashboard)
5. [Leaderboard](#5-leaderboard)
6. [Choice Points Page](#6-choice-points-page)
7. [Rider Groups Page](#7-rider-groups-page)
8. [Profile Page](#8-profile-page)
9. [Admin — Expanded Scope](#9-admin--expanded-scope)
10. [Non-functional Requirements](#10-non-functional-requirements)

---

## 1. CMS Integration (Sanity)

### What it is
Sanity is a headless CMS — a place where non-developers can write and manage content (texts, images, videos) through a friendly editing interface. The website then pulls that content in and displays it. This means the marketing team can update the homepage text, swap a hero image, or add a FAQ question without touching any code.

### What needs to be built

#### 1.1 Sanity project setup
- Create a Sanity project (or connect to the existing one if it already exists).
- Define the content schemas (the shapes of documents editors can create). These are described in section 3.
- Deploy Sanity Studio so editors can log in at e.g. `studio.deurden bocht.be` and manage content.

#### 1.2 `@ddb/sanity` package (separate monorepo package)

All Sanity integration code lives in `packages/sanity` — **not** in the web app. This follows the same pattern as `@ddb/supabase`. The web app imports from it; it never writes Sanity code directly.

The package exposes four entry points:

| Import path | What it exports |
|-------------|-----------------|
| `@ddb/sanity/client` | `sanityClient()` and `sanityPreviewClient()` — configured Sanity clients |
| `@ddb/sanity/image` | `urlFor(source)` — image URL builder wrapping `@sanity/image-url` |
| `@ddb/sanity/queries/page` | `pageBySlugQuery`, `allPageSlugsQuery` — GROQ query strings |
| `@ddb/sanity/types` | All TypeScript types for pages, blocks, and CMS primitives |

**Why a separate package?**  
Any future app in this monorepo (a dedicated admin studio companion, a mobile app backend, a Sanity webhook handler) can import the same client and types without duplicating configuration or query strings.

#### 1.3 Web app data fetching

Route loaders in the web app import from `@ddb/sanity/*` and call the Sanity client server-side:

```ts
// apps/web/app/routes/home.tsx
import { sanityClient } from "@ddb/sanity/client";
import { pageBySlugQuery } from "@ddb/sanity/queries/page";
import type { PageDocument } from "@ddb/sanity/types";

export async function loader() {
  const page = await sanityClient().fetch<PageDocument>(pageBySlugQuery, { slug: "home" });
  return { page };
}
```

Content is fetched on the server and rendered as HTML — fast for visitors and crawlable by search engines.

#### 1.3 Image delivery
- All images managed in Sanity are served via Sanity's CDN with automatic format and size optimisation.
- Use `@sanity/image-url` to generate responsive image URLs with the right dimensions.

#### 1.4 Video delivery
- Hero videos are uploaded to Sanity as files or referenced via an external URL (Mux or YouTube/Vimeo embed).
- The schema supports both: a native uploaded video and an external embed URL.
- The component checks which is present and renders accordingly.

---

## 2. Public Pages — Homepage & About

### Homepage

The homepage is the first thing a visitor sees. It is fully managed through Sanity. An editor opens the CMS, edits the homepage document, saves it, and the website reflects the changes — no code needed.

**What an editor can configure:**
- One or more content blocks stacked vertically (see section 3 for the full list of block types).
- The order of blocks can be rearranged in the CMS with drag-and-drop.
- Blocks can be added, removed, or hidden (draft mode) without removing them permanently.

**Example default layout:**
1. Hero block — big headline, subline, CTA buttons, background video or image.
2. Feature strip — three columns of short selling points (e.g. "Live leaderboard", "Choice points", "Rally zones").
3. How-it-works block — numbered steps explaining what participants do on the day.
4. Event info block — date, location, price, registration link.
5. FAQ section.
6. Final call-to-action — "Register now" banner.

### About page

Same principle as the homepage — a Sanity document with an ordered list of content blocks. Likely simpler: a text-heavy page with a hero, one or two image/text blocks describing the event history and organisation, and a FAQ.

---

## 3. Content Block System

The content block system is a library of reusable building blocks. An editor picks from a menu of block types and assembles a page like stacking Lego bricks. Every block type is both a Sanity schema and a React component.

### 3.1 Hero block

**Purpose:** The main attention-grabbing section at the top of a page.

**Fields an editor fills in:**
| Field | Type | Notes |
|-------|------|-------|
| Eyebrow text | Short text | Small label above the title, e.g. "2026 Edition" |
| Title | Rich text (bold, line breaks) | Main headline |
| Subtitle | Text | One or two sentences below the headline |
| CTA buttons | Array of buttons (label + link) | Up to two buttons, each with an intent: primary or secondary |
| Background type | Toggle: image or video | Determines which media field is used |
| Background image | Sanity image asset | Used when type = image |
| Background video (uploaded) | Sanity file asset | Used when type = video (auto-plays silently, looped) |
| Background video (embed URL) | URL | Alternative: YouTube / Vimeo embed |
| Overlay opacity | Number 0–100 | Darkens the background so text stays readable |
| Content alignment | Left / Center / Right | How the text is positioned |
| Min height | Small / Medium / Large / Full screen | Controls how tall the hero is |

**Render logic:**
- If background type is "video" and an uploaded file exists, render a `<video autoPlay loop muted playsInline>` tag.
- If background type is "video" and only an embed URL exists, render an `<iframe>` (YouTube/Vimeo) with `autoplay=1&mute=1&loop=1`.
- If background type is "image", render a responsive `<img>` using the Sanity image URL builder.
- Always render the overlay `<div>` with the configured opacity.
- CTA buttons use the existing `LinkButton` component.

---

### 3.2 Feature strip

**Purpose:** Three to six short feature cards in a row — good for listing selling points.

**Fields:**
| Field | Type |
|-------|------|
| Items | Array of: icon (from a predefined set), title, body text |
| Columns | 2 / 3 / 4 |
| Background | Surface / Surface-card / Transparent |

---

### 3.3 Image + text block

**Purpose:** A two-column layout with an image on one side and text on the other. Common for storytelling sections.

**Fields:**
| Field | Type |
|-------|------|
| Image | Sanity image |
| Image position | Left / Right |
| Eyebrow | Short text |
| Title | Text |
| Body | Rich text (paragraphs, bold, lists, links) |
| CTA button | Optional: label + link |

---

### 3.4 Rich text block

**Purpose:** A standalone block of editorial content — paragraphs, headings, lists, inline links, blockquotes. Used for long-form text like rules, history, or descriptions.

**Fields:**
| Field | Type |
|-------|------|
| Content | Portable Text (Sanity's rich text format) |
| Max width | Narrow / Normal / Wide |

---

### 3.5 Call to action banner

**Purpose:** A full-width coloured strip that prompts the visitor to do something — typically register or contact.

**Fields:**
| Field | Type |
|-------|------|
| Title | Text |
| Subtitle | Text |
| CTA button | Label + link |
| Background colour | Brand / Dark / Light |

---

### 3.6 FAQ section

**Purpose:** An expandable list of questions and answers. Visitors click a question to reveal the answer.

**Fields:**
| Field | Type |
|-------|------|
| Title | Text (e.g. "Frequently asked questions") |
| Items | Array of: question (text), answer (rich text) |

**Behaviour:** Each item is a collapsible accordion row. Only one can be open at a time, or all can be open simultaneously — configurable.

---

### 3.7 Stats strip

**Purpose:** A row of large numbers highlighting key event figures — e.g. "286 km route", "4 rally zones", "50 riders".

**Fields:**
| Field | Type |
|-------|------|
| Items | Array of: value (e.g. "286 km"), label (e.g. "Master route") |

---

### 3.8 Custom banner / alert

**Purpose:** A narrow strip at the top or bottom of a page, typically used for time-sensitive announcements (e.g. "Registration closes 1 July").

**Fields:**
| Field | Type |
|-------|------|
| Message | Text |
| Intent | Info / Warning / Urgent |
| Link | Optional: label + URL |
| Dismissable | Boolean — shows a close button |

---

## 4. Participant Dashboard

The dashboard is the home screen for a registered participant after they log in. It gives them a single, clear overview of everything they need to know about the event they are signed up for: what the event looks like, how the route is structured, where they stand among other riders, and which choices they will encounter on the day.

The screenshots provided show a mobile-first design split into several cards. Below is a precise description of each card and its data.

---

### 4.1 Current event card

**What the participant sees:**
A card at the top of the dashboard showing the event they are registered for.

```
Current event                          [ARDENNES_ST…] ←— event slug badge

Ardennes Rally Ride
Sat 18 May · Namur, Belgium

GPX completion                                    58%
████████████████████████░░░░░░░░░░░░  ←— progress bar

┌─────────────────┬──────────────┬──────────────────┐
│ 📍 286 km       │ ⑂  5         │ 🏆 24            │
│ Master route    │ Decision     │ Riders live      │
│                 │ zones        │                  │
└─────────────────┴──────────────┴──────────────────┘
```

**Data required:**
| Field | Source | Description |
|-------|--------|-------------|
| Event name | `events.name` | The active event the participant is registered for |
| Event slug badge | `events.slug` | Short code shown as a badge in the top-right corner |
| Event date | `events.event_date` | Formatted as "Sat 18 May" |
| Event location | `events.location` | City and country |
| GPX completion % | Calculated | Total length of completed GPX legs ÷ total route length × 100. Updated live as the rider progresses. On the day before the event this always shows 0%. |
| Total route distance (km) | Computed from GPX legs | Sum of all master-route GPX leg distances |
| Route type label | `participants.event_choice` | "Master route" or the name of the chosen route variant |
| Decision zones count | Count of `choice_points` | Number of choice points on the route |
| Riders live count | Realtime count | Number of participants whose GPS was active in the last 10 minutes |

**States:**
- **Before the event:** GPX completion = 0%, "Riders live" shows 0 or is hidden.
- **During the event:** All numbers are live.
- **After the event:** GPX completion shows the final achieved percentage; "Riders live" is replaced with a "Event ended" indicator.

---

### 4.2 GPX stage preview card

**What the participant sees:**
A card showing a visual schematic of the route and a list of the individual legs (stages) that make up the full route.

```
VISIBLE ROUTE                          [NAVIGATABLE] ←— badge

GPX stage preview

    ···•·····•···•·····•····•  ←— visual route line with dots (SVG)

  1  Forest Warmup
     74 km · Tarmac + ridge gravel · Signal de Botrange

  2  River Descent
     51 km · Fast valley asphalt · La Roche split gate

  3  Castle Return
     68 km · B-roads + cobbled village · Bouillon ramparts

┌───────────────────────┬───────────────────────────┐
│ ⏱  4h 40m            │ ⚑  3                      │
│ ETA to finish         │ GPX legs live             │
└───────────────────────┴───────────────────────────┘
```

**Data required:**
| Field | Source | Description |
|-------|--------|-------------|
| "NAVIGATABLE" badge | Event config | Shows when the GPS data is locked and published. Hidden before the route is finalised. |
| Route schematic | GPX geometry | A simplified SVG path drawn from the waypoints of the master route. It does not show the real map — it is an abstract squiggly line to give a visual feel of the route shape. |
| Leg number | `gpx_legs.order` | Sequential number per leg |
| Leg name | `gpx_legs.name` | e.g. "Forest Warmup" |
| Leg distance | `gpx_legs.distance_km` | Calculated from the GPX file |
| Leg surface / notes | `gpx_legs.description` | Short descriptor like "Tarmac + ridge gravel" |
| Leg end point name | `gpx_legs.end_point_name` | Name of the choice point or final destination this leg leads to |
| ETA to finish | Calculated | Based on average riding speed (configurable per event, e.g. 60 km/h) and remaining distance |
| GPX legs live | Count | Number of legs currently in "active" state — i.e. the event has started and the leg is reachable |

---

### 4.3 Choice points section

**What the participant sees:**
A list of the choice points they will encounter on the route. A choice point is a location on the road where the participant decides: do I take the fixed detour (sidetrack) or enter a rally zone? Each option shows its type, duration, and point value.

```
CHOICE POINT                                  [126 KM] ←— distance from start

La Roche split gate

  ┌──────────────────────────────────────────────────────┐
  │ Sidetrack // Ridge Sprint                        →   │
  │ A guided detour with scenic ridgelines and a hard    │
  │ handoff into the next GPX leg.                       │
  │                                                      │
  │ [FIXED GPX SEGMENT]              38 min · +120 pts   │
  └──────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────┐
  │ Rally Zone // Abbey Hunt                         →   │
  │ Receive directional clues, solve tasks on site,      │
  │ and route yourself between checkpoints.              │
  │                                                      │
  │ [OPEN NAVIGATION]                62 min · +260 pts   │
  └──────────────────────────────────────────────────────┘
```

**Each choice card shows:**
| Field | Source | Description |
|-------|--------|-------------|
| Choice name | `choice_point_options.name` | e.g. "Ridge Sprint" |
| Type prefix | Computed | "Sidetrack //" or "Rally Zone //" based on the option type |
| Description | `choice_point_options.description` | One to two sentences |
| Type badge | `choice_point_options.type` | "FIXED GPX SEGMENT", "OPEN NAVIGATION", etc. |
| Estimated duration | `choice_point_options.estimated_minutes` | In minutes, shown as "38 min" |
| Points | `choice_point_options.points` | Shown as "+120 pts" |
| Distance from start | Calculated from GPX legs | Shown at the top of each choice point group |

**Choice card types and their meaning:**
- **Fixed GPX segment (Sidetrack):** The rider follows a predetermined GPS track. Less exploratory, fewer points.
- **Open Navigation (Rally Zone):** The rider receives directional clues and finds checkpoints themselves. Higher freedom, higher points.
- **Open Mountain Navigation:** Same as Open Navigation but with a more dramatic setting label.

**Interaction:**
Tapping a card navigates to the choice point detail page (out of scope for this phase — listed in future scope).

---

### 4.4 Dashboard layout and structure

The dashboard renders these cards in a single scrollable column on mobile. On desktop, it uses a two-column grid for the top section (event card + GPX preview side by side) and full-width for the choice points list.

The page is wrapped in the `ProtectedLayout` (requires login). The loader:
1. Reads the participant's registration from Supabase.
2. Fetches the active event.
3. Fetches the GPX legs for that event, ordered by `leg_order`.
4. Fetches the choice points for that event, ordered by `distance_from_start_km`.
5. Fetches the live rider count (Realtime or a 30-second cached count).
6. Returns all of this to the component.

---

## 5. Leaderboard

The leaderboard page shows the live competitive standings during the event.

```
LIVE COMPETITION                                     👥

Rider leaderboard

  ┌──────────────────────────────────────────────────────┐
  │  1   Tobias Lemmens               715                │
  │      KTM 890 Adventure · Castle Return               │
  ├──────────────────────────────────────────────────────┤
  │  2   Jules Maes                   680                │
  │      BMW GS 1300 · Abbey Hunt                        │
  ├──────────────────────────────────────────────────────┤
  │  3   Nina Vermeer                 540                │
  │      Ducati DesertX · Forest Warmup                  │
  └──────────────────────────────────────────────────────┘
```

**Each row shows:**
| Field | Source |
|-------|--------|
| Rank (position number) | Computed: ORDER BY total_points DESC |
| Rider display name | `participants.first_name` + `last_name` |
| Motorcycle | `participants.motorcycle_brand` + `model` |
| Current stage | Name of the GPX leg or rally zone the participant is currently in |
| Points total | `participants.total_points` — updated whenever a task is completed |

**Release groups (Participant waves):**

Above the leaderboard, show the departure groups:

```
RELEASE GROUPS

Participant waves

  Lead pack           08:00–08:10          2 riders
  Scenic riders       08:10–08:25          2 riders
```

This shows which group the participant belongs to (highlighted) and the departure time windows for all groups.

**Behaviour:**
- Before the event starts: shows a placeholder "Rally hasn't started yet."
- During the event: live updates via Supabase Realtime subscription.
- After the event: shows the final standings with no live badge.

---

## 6. Choice Points Page

Separate from the dashboard, the choice points page is a standalone deep-dive. It shows all choice points in order, each expandable to see the full list of options and their details. The participant uses this before the event day to plan their route.

This page is listed in the navigation as "Forks". It is a read-only informational page — participants cannot make their choice in the app (they physically ride to the fork and decide on the road).

---

## 7. Rider Groups Page

Shows the participant which group they are in and who else is in their group. Groups are useful for friends riding together or for the organisation to stagger departure times.

```
YOUR GROUP

  Thomas Seyssens      KTM 890 Adventure
  Jan Janssen          BMW R 1250 GS

GROUP WAVES

  Lead pack            08:00–08:10      6 riders
  Scenic riders        08:10–08:25      9 riders
```

Data comes from `rider_groups` and `rider_group_members` tables.

---

## 8. Profile Page

The profile page currently shows name and email. It needs to be expanded to a full participant profile:

**What the participant sees:**

1. **Account information** — name, email, phone number. Edit button opens an inline form.
2. **Motorcycle details** — brand, model, year, license plate, category. Editable.
3. **Emergency contact** — name and phone. Editable.
4. **My registration** — which event, which package (Complete or Basic), payment status (Paid / Pending / Failed), registration date.
5. **Danger zone** — option to request account deletion (sends a request to the admin; not instant).

Editing is done via a `PATCH` action on the same route. Changes update the `participants` record in Supabase.

---

## 9. Admin — Expanded Scope

The admin section is minimal today (overview + event CRUD). The following needs to be added in future phases:

### 9.1 Participant management
- List all participants for the active event (name, email, motorcycle, package, payment status).
- Search and filter by name, status, group.
- View a single participant's full details.
- Manually mark a participant as paid.
- Delete a participant (with confirmation).

### 9.2 GPX legs management
- Upload a GPX file for a leg.
- Give the leg a name, description, surface notes, and order number.
- Preview the route on a map within the admin.

### 9.3 Choice points management
- Create a choice point: name, distance from start, linked GPX leg.
- Add options to a choice point: name, type, description, estimated duration, points.
- Reorder options.

### 9.4 Live event dashboard (admin view)
Based on the "Flow orchestration" and "Zone analytics" screens in the reference screenshots:

```
FLOW ORCHESTRATION

Branch traffic and regrouping

  Ridge Sprint          [SIDETRACK]      6 riders
  Abbey Hunt            [RALLY-ZONE]     9 riders
  Summit Signal         [RALLY-ZONE]     4 riders

ZONE ANALYTICS

Proof completion overview

  Abbey Hunt     82%    55 min avg · 1 pending
  Summit Signal  67%    72 min avg · 1 pending
```

This live dashboard shows:
- How many riders chose each option at each choice point.
- Completion rate of rally zones (what percentage of riders in a zone finished their tasks).
- Average time spent in a zone.
- How many riders have a pending submission that needs admin validation.

All updated in real time via Supabase Realtime.

### 9.5 Task validation queue
When participants submit a photo or text task, the admin reviews and approves or rejects it. This screen shows the queue of pending submissions.

### 9.6 Notifications
Admin can send a push notification or in-app message to all participants or a specific group (e.g. "The finish location has moved — see updated map").

---

## 10. Non-functional Requirements

### Performance
- All public pages (homepage, about) must achieve a Lighthouse Performance score ≥ 90 on mobile.
- Images are lazy-loaded and served in WebP/AVIF format via Sanity CDN.
- Hero videos use `preload="none"` and start loading only when visible in the viewport.

### Offline support
- The dashboard, GPX stages, and choice points must be readable without an internet connection.
- Use a service worker to cache the last-fetched event data.
- When offline, the app shows a clear banner: "You're offline — showing cached data from [time]."
- This is critical: participants ride through areas with no signal.

### Mobile-first
- The entire app is designed for a phone screen first.
- Touch targets are at minimum 44×44 px.
- The bottom navigation bar on mobile must remain reachable with one thumb.

### Accessibility
- All interactive elements are keyboard accessible.
- Colour contrast meets WCAG AA at minimum.
- Images have descriptive `alt` text (editable in Sanity for the CMS-managed ones).

### Security
- All participant data is protected by Supabase Row Level Security — a participant can only read their own data.
- The admin panel is accessible only to users with the `admin` role in `app_metadata`.
- No sensitive fields (password, payment info) are ever stored in the web app's own database.

---

## Delivery phases (suggested)

| Phase | Scope |
|-------|-------|
| **Phase 1 (current)** | Auth, registration, admin event CRUD, nav, dark theme — ✅ Done |
| **Phase 2** | Sanity setup, homepage + about with content blocks, hero (image + video) |
| **Phase 3** | Dashboard — event card + GPX stage preview + choice points preview |
| **Phase 4** | Leaderboard (live), rider groups, profile editing |
| **Phase 5** | Admin — participants, GPX legs, choice points, live event dashboard |
| **Phase 6** | Offline support, PWA, push notifications |
