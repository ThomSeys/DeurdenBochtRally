# Deur Den Bocht - Setup Guide

This guide will help you set up and deploy the Deur Den Bocht rally website.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (https://supabase.com)
- A Stripe account (https://stripe.com)
- Git installed

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Create a new project at https://supabase.com
2. Go to Project Settings > API
3. Copy your project URL and anon key
4. Go to the SQL Editor
5. Run the SQL from `supabase-schema.sql` to create all tables

## Step 3: Set Up Stripe

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Dashboard
3. Set up webhook endpoint for payment confirmations:
   - Go to Developers > Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhook`
   - Select events: `checkout.session.completed`

## Step 4: Configure Environment Variables

Create a `.env.local` file in `apps/web/`:

```bash
# Copy from .env.example
cp apps/web/.env.example apps/web/.env.local
```

Fill in the following values:

```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
SESSION_SECRET=generate_a_random_string_here
APP_URL=http://localhost:5173
```

To generate a session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 5: Run the Development Server

```bash
npm run dev
```

The site will be available at http://localhost:5173

## Step 6: Upload Documents

After the site is running, you'll need to upload:

1. **GPX Files**: Upload the route GPX files to Supabase Storage
2. **Rally Book**: Create and upload the digital bochtenboek (PDF)
3. **Maps**: Upload any additional maps or instructions

To add documents to the database:

```sql
INSERT INTO documents (title, description, file_url, file_type, category, visible_to_public)
VALUES 
  ('Hoofdroute GPX', 'De complete 500+ km route', 'https://your-storage-url/route.gpx', 'gpx', 'route', true),
  ('Bochtenboek', 'Het complete bochtenboek', 'https://your-storage-url/bochtenboek.pdf', 'pdf', 'rally_book', false);
```

## Step 7: Testing

### Test Registration Flow

1. Go to `/registration`
2. Fill in the form
3. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
4. Complete the payment
5. Check your email for confirmation

### Test Login

1. Go to `/login`
2. Use the email and QR code from registration
3. Access the dashboard

### Test Rally Submission

1. Login to dashboard
2. Go to "Rally Codes Indienen"
3. Fill in codes and submit

## Step 8: Production Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Set environment variables in Vercel dashboard
5. Deploy!

### Environment Variables for Production

Make sure to set all environment variables in your deployment platform:
- Update `APP_URL` to your production domain
- Use production Stripe keys
- Keep `SESSION_SECRET` secure

## Step 9: Post-Deployment

1. Update Stripe webhook URL to production domain
2. Test the full registration flow in production
3. Upload all documents (GPX, maps, etc.)
4. Send test emails to verify email delivery

## Features Overview

### Public Pages
- **Homepage** (`/`): Event information and pricing
- **About** (`/about`): Detailed event schedule and info
- **Rally** (`/rally`): All 8 rally zones with descriptions
- **Registration** (`/registration`): Registration form with Stripe payment

### Authenticated Pages
- **Dashboard** (`/dashboard`): Personal dashboard with documents
- **Rally Submission** (`/dashboard/rally-submission`): Submit rally codes

### Payment Flow
1. User fills registration form
2. Redirected to Stripe Checkout
3. Payment processed
4. User redirected to success page
5. Confirmation email sent (configure in Supabase)

## Customization

### Styling
- Edit colors in `apps/web/tailwind.config.ts`
- Modify global styles in `apps/web/app/styles/global.css`

### Email Templates
Configure email templates in Supabase:
1. Go to Authentication > Email Templates
2. Customize the confirmation email template

### Adding Documents
Use the Supabase dashboard or SQL to add documents:

```sql
INSERT INTO documents (title, description, file_url, file_type, category)
VALUES ('New Document', 'Description', 'URL', 'pdf', 'instruction');
```

## Troubleshooting

### "Missing environment variables" error
- Ensure all required env vars are set in `.env.local`
- Restart the dev server after changing env vars

### Stripe payment not working
- Check webhook is configured correctly
- Verify Stripe keys are correct
- Check webhook secret matches

### Login not working
- Verify QR code matches exactly
- Check email is lowercase
- Ensure payment status is 'completed'

## Support

For questions or issues, contact:
- Email: info@deurdenbocht.be
- Create an issue on GitHub

## License

All rights reserved - Deur Den Bocht 2026
