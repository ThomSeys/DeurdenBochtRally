# Deur Den Bocht - Rally Website

> *"Altijd via de omweg."*

Complete web application for the Deur Den Bocht motorcycle rally event.

## 🚀 Quick Start

**New to this project?**  
→ Start with [`docs/QUICKSTART.md`](docs/QUICKSTART.md)

**Need the full setup?**  
→ See [`docs/SETUP.md`](docs/SETUP.md)

**Deploying to production?**  
→ Check [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

**Something not working?**  
→ See [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)

## 📚 Documentation

All documentation is organized in the `docs/` directory:
- **[docs/INDEX.md](docs/INDEX.md)** - Complete documentation index
- **[docs/QUICKSTART.md](docs/QUICKSTART.md)** - 5-minute setup
- **[docs/SETUP.md](docs/SETUP.md)** - Full installation
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production guide
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues

**For archived/completed documentation**, see:
- [`docs/ARCHIVED.md`](docs/ARCHIVED.md) - Old feature documentation
- [`ROOT-DOCS-ARCHIVED.md`](ROOT-DOCS-ARCHIVED.md) - Root-level archived docs

## ✨ Features

- 🌐 Promotional website with event information
- 📝 Online registration with Stripe payments
- 🔐 Secure authentication with QR codes
- 📱 Participant dashboard with routes & maps
- 🏆 Rally system with point tracking & leaderboard
- 📱 Offline-first PWA for poor connectivity
- 🔔 Push notifications for participants
- 🗺️ Live GPS tracking and mapping

## 🛠 Technology Stack

- **[React Router v7](https://reactrouter.com/)** - Frontend framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe code
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Supabase](https://supabase.com/)** - Database & auth
- **[Stripe](https://stripe.com/)** - Payments
- **[TurboRepo](https://turbo.build/)** - Monorepo management

## 📁 Project Structure

```
site/
├── apps/web/                       # Main React application
├── sanity-studio/                  # Sanity CMS studio
├── scripts/                        # Database & setup scripts
├── docs/                           # Documentation (start here!)
├── setup-db.sh                    # Database initialization
└── package.json                    # Dependencies
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run build
npm run build

# Run linting
npm run lint
```

## 🌍 Environment Variables

Required in `apps/web/.env.local`:
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_PUBLIC_KEY=...
STRIPE_SECRET_KEY=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

See `docs/SETUP.md` for complete setup instructions.

## 📖 Full Documentation

All guides, features, and references are in the `docs/` directory. See [`docs/INDEX.md`](docs/INDEX.md) for the complete index.

---

**Questions?** Check [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) or review `docs/README.md`
