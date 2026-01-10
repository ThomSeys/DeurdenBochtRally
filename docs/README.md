# 🏍 Deur Den Bocht - Rally Website

> *"Altijd via de omweg."*

A complete TurboRepo monorepo for the Deur Den Bocht motorcycle rally event - featuring online registration, payment processing, participant dashboards, and rally management.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Remix](https://img.shields.io/badge/Remix-000000?style=flat&logo=remix&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=flat&logo=stripe&logoColor=white)

## 🎯 What is this?

A comprehensive web application for managing the **Deur Den Bocht** motorcycle rally - a unique 500+ km ride through Belgium, Northern France, and the Ardennes, featuring:

- 🌐 **Promotional Website** - Event information, schedule, and rally zones
- 📝 **Online Registration** - Complete signup with Stripe payment integration
- 🔐 **Authentication** - Secure login with QR code verification  
- 📱 **Participant Dashboard** - Access to GPX routes, maps, and documents
- 🏆 **Rally System** - Submit codes, track points, compete for "Den Bochtenkoning"

## ✨ Key Features

### For Participants
✅ Easy online registration with instant payment  
✅ Email confirmation with unique QR code  
✅ Personal dashboard with all event materials  
✅ Download GPX routes and rally maps  
✅ Submit rally codes and view score  
✅ Track position on leaderboard  

### For Organizers
✅ Automatic payment processing via Stripe  
✅ Participant management through Supabase  
✅ Document distribution system  
✅ Automated rally scoring  
✅ Check-in via QR codes  
✅ Real-time participant data  

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
1. Create a [Supabase](https://supabase.com) account and project
2. Run the SQL from `supabase-schema.sql` in the SQL Editor
3. Copy your project URL and keys

### 3. Configure Stripe
1. Create a [Stripe](https://stripe.com) account
2. Get your API keys from the Dashboard
3. Set up webhook for payment confirmations

### 4. Environment Variables
```bash
cp apps/web/.env.example apps/web/.env.local
# Fill in your Supabase and Stripe credentials
```

### 5. Start Development Server
```bash
npm run dev
```

Visit **http://localhost:5173** 🎉

## 📁 Project Structure

```
deur-den-bocht/
├── apps/
│   └── web/                    # Remix application
│       ├── app/
│       │   ├── components/     # React components
│       │   ├── lib/            # Utilities (Supabase, Stripe, Auth)
│       │   ├── routes/         # Page routes
│       │   └── styles/         # Global styles
│       └── package.json
├── supabase-schema.sql         # Database schema
├── SETUP.md                    # Detailed setup guide
├── DOCUMENTATION.md            # Technical documentation
├── QUICKSTART.md              # Quick reference
└── package.json                # Root configuration
```

## 🛠 Technology Stack

- **[Remix](https://remix.run)** - Full-stack React framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Supabase](https://supabase.com)** - PostgreSQL database & auth
- **[Stripe](https://stripe.com)** - Payment processing
- **[TurboRepo](https://turbo.build)** - Monorepo management
- **[Vite](https://vitejs.dev/)** - Lightning-fast builds

## 📱 Pages

### Public
- `/` - Homepage with event info
- `/about` - Event details and schedule
- `/rally` - 8 Rally zones information
- `/registration` - Registration form
- `/login` - Participant login

### Protected (Requires Login)
- `/dashboard` - Personal dashboard
- `/dashboard/rally-submission` - Submit rally codes

## 💰 Pricing

| Formula | Price | Includes |
|---------|-------|----------|
| **With Meals** | €20 | Breakfast, Lunch & Dinner + Route |
| **Breakfast Only** | €10 | Breakfast + Route |

## 🏆 Rally Scoring

| Achievement | Points |
|-------------|--------|
| Each Rally Zone | +15 |
| All 8 Zones | +20 bonus |
| Distance > 500km | +10 |
| No Highways | +10 |
| Rode in Rain | +5 |

**Total possible:** 165 points  
**Minimum to qualify:** 4 zones

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in minutes
- **[SETUP.md](SETUP.md)** - Complete setup instructions
- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Technical details
- **[FEATURES.md](FEATURES.md)** - Full feature list

## 🔒 Security

✅ Row Level Security (RLS) enabled  
✅ Secure session management  
✅ Environment variable protection  
✅ HTTPS required in production  
✅ Stripe webhook verification  
✅ SEO protection with noindex/nofollow control  

## 🌐 Deployment

Ready to deploy to **Vercel** with full SEO protection:

### Quick Deploy
1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy!

**📖 Complete Instructions:**
- **[VERCEL-DEPLOYMENT.md](VERCEL-DEPLOYMENT.md)** - Step-by-step Vercel setup
- **[SEO-GUIDE.md](SEO-GUIDE.md)** - Complete SEO documentation
- **[SEO-DEPLOYMENT-SUMMARY.md](SEO-DEPLOYMENT-SUMMARY.md)** - Quick reference

### SEO Protection 🔒
The site includes built-in SEO protection:
- **noindex/nofollow** tags (currently ENABLED)
- Dynamic **robots.txt** route
- XML **sitemap** generation
- Open Graph & Twitter Card meta tags
- Managed through **Sanity CMS**

**Status**: Site is protected from search engines by default. Disable protection in Sanity Studio when ready to launch.

## 📦 What's Included

### Implemented ✅
- Complete promotional website with custom brand styling
- Sanity CMS integration with edition management
- Registration system with Stripe payments
- Authentication with QR code
- Participant dashboard
- Rally submission system
- Document management
- Automatic scoring
- Database schema with RLS
- **SEO optimization with protection**
- **Vercel deployment ready**
- **Dynamic robots.txt and sitemap**

### CMS Features 🎨
- **Sanity Studio**: https://deurdenbochtrally.sanity.studio
- Content types: Sponsors, Stats, Pricing, Rally Zones, Site Config
- Edition/year management system
- Image optimization via Sanity CDN
- Real-time content updates

### Future Enhancements 🚧
- Admin dashboard
- Email notifications
- Live leaderboard
- Photo gallery
- Weather API integration

## 🤝 Contributing

This is a private project for the Deur Den Bocht event. For questions or support:

📧 **Email:** info@deurdenbocht.be  
🌐 **Sanity Studio:** https://deurdenbochtrally.sanity.studio

## 📄 License

All rights reserved © Deur Den Bocht 2026

---

Built with ❤️ for motorcycle enthusiasts who believe in taking the scenic route.

**"Altijd via de omweg."** 🏍💨
