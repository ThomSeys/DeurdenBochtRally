# 🏍 Deur Den Bocht - Quick Start

## What's Been Created

A complete TurboRepo monorepo with a Remix website for the Deur Den Bocht motorcycle rally event.

## ✅ What's Included

### 🎨 Frontend Features
- ✅ Modern Remix + React + TypeScript setup
- ✅ Responsive design with Tailwind CSS
- ✅ Professional homepage with event information
- ✅ About page with detailed schedule
- ✅ Rally zones page with all 8 zones
- ✅ Registration form with payment integration
- ✅ Login system with QR code authentication
- ✅ Protected participant dashboard
- ✅ Rally submission form with automatic scoring

### 🔧 Backend Features
- ✅ Supabase integration for database
- ✅ Stripe payment processing
- ✅ Session-based authentication
- ✅ Secure API routes
- ✅ Complete database schema

### 📁 Pages Created
1. **/** - Homepage
2. **/about** - Event details and schedule
3. **/rally** - 8 Rally zones information
4. **/registration** - Registration form with Stripe
5. **/registration/success** - Payment confirmation
6. **/login** - Login with email + QR code
7. **/dashboard** - Participant dashboard
8. **/dashboard/rally-submission** - Submit rally codes

## 🚀 Next Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase
1. Create account at https://supabase.com
2. Create new project
3. Run the SQL from `supabase-schema.sql` in SQL Editor
4. Copy your project URL and keys

### 3. Set Up Stripe
1. Create account at https://stripe.com
2. Get your API keys
3. Set up webhook for payments

### 4. Configure Environment
```bash
cp apps/web/.env.example apps/web/.env.local
```
Then fill in your credentials.

### 5. Start Development
```bash
npm run dev
```

Visit http://localhost:5173

## 📚 Documentation

- **SETUP.md** - Detailed setup instructions
- **DOCUMENTATION.md** - Complete technical documentation
- **supabase-schema.sql** - Database schema

## 🎯 Key Features

### For Participants
- Online registration with immediate payment
- Email confirmation with QR code
- Personal dashboard with documents
- Access to GPX routes and maps
- Rally submission with automatic scoring
- View leaderboard position

### For Organizers
- Automatic payment processing
- Participant management via Supabase
- Document distribution system
- Rally scoring system
- Check-in via QR codes

## 💰 Payment Options
- **€20** - With all meals (breakfast, lunch, dinner)
- **€10** - Breakfast only

## 🏆 Rally System
- 8 optional Rally Zones
- 15 points per zone
- Bonus points for achievements
- Automatic score calculation
- Real-time leaderboard

## 🛠 Tech Stack
- **Remix** - Full-stack React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Database & Auth
- **Stripe** - Payments
- **TurboRepo** - Monorepo management

## 📦 Project Structure
```
site/
├── apps/
│   └── web/              # Remix application
│       ├── app/
│       │   ├── components/
│       │   ├── lib/
│       │   ├── routes/
│       │   └── styles/
│       └── package.json
├── supabase-schema.sql   # Database setup
├── SETUP.md             # Setup guide
├── DOCUMENTATION.md     # Full docs
└── package.json         # Root config
```

## 🎨 Customization

### Change Colors
Edit `apps/web/tailwind.config.ts`

### Modify Content
Edit files in `apps/web/app/routes/`

### Add Documents
Insert into Supabase `documents` table

## 🔒 Security
- ✅ Row Level Security enabled
- ✅ Secure session management
- ✅ Environment variables
- ✅ HTTPS required in production
- ✅ Stripe webhook verification

## 📧 Email System
Configure email templates in Supabase Dashboard under Authentication > Email Templates.

## 🌐 Deployment
Ready to deploy to:
- Vercel (recommended)
- Netlify
- Any Node.js hosting

See SETUP.md for deployment instructions.

## 🐛 Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Environment variables not loading
```bash
# Restart dev server after changing .env.local
npm run dev
```

### Stripe webhook fails
Check your webhook secret matches in `.env.local`

## 📞 Support
For questions about the setup:
- Check SETUP.md for detailed instructions
- Check DOCUMENTATION.md for technical details
- Review supabase-schema.sql for database structure

## 🎉 You're Ready!
Everything is set up and ready to go. Follow the steps above to get started!

Good luck with Deur Den Bocht! 🏍💨
