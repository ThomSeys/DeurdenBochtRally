# Deur Den Bocht - Project Documentation

## 🏍 Project Overview

Deur Den Bocht is a comprehensive web application for managing a motorcycle rally event. The system handles:
- Event promotion and information
- Online registration with payment processing
- Participant authentication and dashboard
- Rally zone submissions and scoring
- Document management (GPX files, maps, instructions)

## 📁 Project Structure

```
deur-den-bocht/
├── apps/
│   └── web/                    # Main Remix application
│       ├── app/
│       │   ├── components/     # React components
│       │   │   ├── Header.tsx
│       │   │   └── Footer.tsx
│       │   ├── lib/            # Utilities and helpers
│       │   │   ├── supabase.server.ts
│       │   │   ├── stripe.server.ts
│       │   │   ├── session.server.ts
│       │   │   └── database.types.ts
│       │   ├── routes/         # Remix routes
│       │   │   ├── _index.tsx              # Homepage
│       │   │   ├── about.tsx               # About page
│       │   │   ├── rally.tsx               # Rally zones
│       │   │   ├── registration.tsx        # Registration form
│       │   │   ├── registration.success.tsx
│       │   │   ├── login.tsx               # Login
│       │   │   ├── logout.tsx
│       │   │   ├── dashboard._index.tsx    # Dashboard
│       │   │   └── dashboard.rally-submission.tsx
│       │   ├── styles/
│       │   │   └── global.css
│       │   ├── entry.client.tsx
│       │   ├── entry.server.tsx
│       │   └── root.tsx
│       ├── public/
│       ├── package.json
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       └── vite.config.ts
├── supabase-schema.sql         # Database schema
├── package.json                # Root package.json
├── turbo.json                  # TurboRepo config
├── README.md
└── SETUP.md

```

## 🛠 Technology Stack

### Frontend
- **Remix** - Full-stack React framework
- **React** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool

### Backend
- **Supabase** - Database and authentication
- **PostgreSQL** - Database
- **Stripe** - Payment processing

### Infrastructure
- **TurboRepo** - Monorepo management
- **Vercel** - Hosting (recommended)

## 🗄 Database Schema

### Tables

#### `participants`
Stores all registered participants.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | Participant email (unique) |
| first_name | TEXT | First name |
| last_name | TEXT | Last name |
| phone | TEXT | Phone number |
| motorcycle_brand | TEXT | Motorcycle brand |
| motorcycle_model | TEXT | Motorcycle model |
| license_plate | TEXT | License plate |
| formula | TEXT | 'with_meals' or 'breakfast_only' |
| amount_paid | INTEGER | Amount in euros |
| payment_status | TEXT | 'pending', 'completed', or 'failed' |
| stripe_payment_id | TEXT | Stripe payment ID |
| qr_code | TEXT | Unique QR code for check-in |
| checked_in | BOOLEAN | Check-in status |
| ride_type | TEXT | 'free' or 'guided' |

#### `rally_submissions`
Stores rally zone submissions and scores.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| participant_id | UUID | Foreign key to participants |
| rz1_code - rz8_code | TEXT | Codes from rally zones |
| total_distance | NUMERIC | Total distance in km |
| used_highways | BOOLEAN | Whether highways were used |
| weather_bonus | BOOLEAN | Whether it rained |
| total_points | INTEGER | Total calculated points |
| submitted_at | TIMESTAMP | Submission time |

#### `documents`
Stores GPX files, maps, and instructions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Document title |
| description | TEXT | Optional description |
| file_url | TEXT | URL to file |
| file_type | TEXT | 'gpx', 'pdf', 'image', 'other' |
| category | TEXT | Document category |
| visible_to_public | BOOLEAN | Public visibility |

## 🔐 Authentication Flow

1. User registers and pays via Stripe
2. Participant record created with unique QR code
3. User receives confirmation email with QR code
4. User logs in with email + QR code
5. Session cookie created
6. User accesses protected dashboard

## 💳 Payment Flow

1. User fills registration form
2. Participant created with `payment_status: 'pending'`
3. User redirected to Stripe Checkout
4. Payment processed by Stripe
5. Webhook updates `payment_status: 'completed'`
6. User redirected to success page
7. Confirmation email sent

## 🏆 Rally Scoring System

| Achievement | Points |
|-------------|--------|
| Each Rally Zone completed | +15 |
| All 8 zones completed | +20 bonus |
| Distance > 500 km | +10 |
| No highways used | +10 |
| Rode in rain | +5 |

**Minimum requirement:** 4 zones to qualify for "Den Bochtenkoning"

## 🚀 Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import repository in Vercel
3. Set environment variables
4. Deploy

### Required Environment Variables

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SESSION_SECRET=
APP_URL=
```

## 📱 Pages Overview

### Public Pages

- **/** - Homepage with event info and pricing
- **/about** - Detailed event information and schedule
- **/rally** - All 8 rally zones with descriptions
- **/registration** - Registration form with payment
- **/registration/success** - Payment confirmation
- **/login** - Login with email + QR code

### Protected Pages

- **/dashboard** - Participant dashboard with documents
- **/dashboard/rally-submission** - Submit rally codes

## 🎨 Customization

### Colors
Edit `apps/web/tailwind.config.ts`:
```typescript
colors: {
  primary: {
    50: '#fef2f2',
    // ... more shades
    900: '#7f1d1d',
  },
}
```

### Content
Edit content directly in route files under `apps/web/app/routes/`

## 📧 Email Configuration

Configure in Supabase:
1. Go to Authentication > Email Templates
2. Customize "Confirmation" template
3. Add event details and QR code

## 🔧 Development

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Type Check
```bash
cd apps/web && npm run typecheck
```

## 🐛 Common Issues

### Port already in use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill
```

### Stripe webhook not working
- Verify webhook secret matches
- Check endpoint URL is correct
- Ensure webhook is enabled in Stripe dashboard

### Session not persisting
- Check SESSION_SECRET is set
- Verify cookies are enabled
- Check secure flag in production

## 📊 Analytics

Consider adding:
- Google Analytics
- Plausible Analytics
- PostHog

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env.local`
2. **Row Level Security**: Enabled on all Supabase tables
3. **HTTPS**: Required in production
4. **CSRF Protection**: Built into Remix
5. **XSS Protection**: React escapes by default

## 📝 Future Enhancements

Potential features to add:
- [ ] Email notifications for rally updates
- [ ] Photo gallery upload
- [ ] Live leaderboard during event
- [ ] GPS tracking integration
- [ ] Mobile app
- [ ] Admin dashboard
- [ ] Automatic email reminders
- [ ] Weather API integration
- [ ] Social media sharing

## 👥 Support

For questions or issues:
- Email: info@deurdenbocht.be
- GitHub Issues: (if open source)

## 📄 License

All rights reserved - Deur Den Bocht © 2026
