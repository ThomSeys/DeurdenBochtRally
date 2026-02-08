# 🚀 Deployment Checklist

Use this checklist to ensure everything is ready before launching your Deur Den Bocht website.

## Pre-Deployment Checklist

### ✅ Development Environment

- [ ] All dependencies installed (`npm install`)
- [ ] Development server runs without errors (`npm run dev`)
- [ ] TypeScript compiles without errors
- [ ] All environment variables set in `.env.local`
- [ ] Database schema created in Supabase
- [ ] Test registration flow works locally
- [ ] Test login flow works locally
- [ ] Test payment flow with Stripe test mode

### ✅ Supabase Setup

- [ ] Supabase project created
- [ ] Database schema executed (`supabase-schema.sql`)
- [ ] Tables created: `participants`, `rally_submissions`, `documents`
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Security policies created
- [ ] Project URL copied
- [ ] Anon key copied
- [ ] Service role key copied (keep secure!)
- [ ] Email templates configured (optional but recommended)

### ✅ Stripe Setup

- [ ] Stripe account created
- [ ] API keys obtained (publishable + secret)
- [ ] Test mode verified working
- [ ] Webhook endpoint created
- [ ] Webhook secret copied
- [ ] Webhook events selected:
  - [ ] `checkout.session.completed`
  - [ ] `payment_intent.succeeded` (optional)
- [ ] Payment methods enabled:
  - [ ] Cards
  - [ ] Bancontact
  - [ ] iDEAL
- [ ] Test payment successful

### ✅ Content Preparation

- [ ] Event details verified in pages
- [ ] Rally zone descriptions complete
- [ ] Contact information updated
- [ ] Email templates ready
- [ ] GPX files prepared
- [ ] Rally book prepared
- [ ] Maps prepared
- [ ] Instruction documents ready

### ✅ Code Quality

- [ ] No console.errors in production code
- [ ] Environment variables not committed
- [ ] `.env.local` in `.gitignore`
- [ ] TypeScript strict mode passing
- [ ] No unused imports
- [ ] All components properly typed
- [ ] Error handling in place
- [ ] Loading states implemented

### ✅ Security Review

- [ ] SESSION_SECRET is random and secure
- [ ] Supabase service role key not exposed to client
- [ ] Stripe secret key not exposed to client
- [ ] RLS policies tested
- [ ] CORS configured correctly
- [ ] HTTPS enforced in production
- [ ] Cookies set to secure in production

## Deployment Steps

### Step 1: Prepare Repository

- [ ] Code pushed to GitHub/GitLab
- [ ] Repository is private (if needed)
- [ ] `.gitignore` properly configured
- [ ] README.md updated with project info

### Step 2: Choose Hosting Platform

#### Option A: Vercel (Recommended)
- [ ] Vercel account created
- [ ] Repository imported
- [ ] Framework preset: Remix
- [ ] Root directory: `apps/web`
- [ ] Build command: `cd ../.. && npm run build`
- [ ] Output directory: `build/client`

#### Option B: Netlify
- [ ] Netlify account created
- [ ] Site created from repository
- [ ] Build settings configured

#### Option C: Custom Server
- [ ] Server provisioned
- [ ] Node.js 18+ installed
- [ ] PM2 or similar process manager
- [ ] Nginx/Apache configured
- [ ] SSL certificate obtained

### Step 3: Environment Variables

Set all required environment variables in your hosting platform:

**Supabase:**
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

**Stripe:**
- [ ] `STRIPE_PUBLIC_KEY` (production key)
- [ ] `STRIPE_SECRET_KEY` (production key)
- [ ] `STRIPE_WEBHOOK_SECRET`

**App:**
- [ ] `SESSION_SECRET`
- [ ] `APP_URL` (your production domain)
- [ ] `NODE_ENV=production`

### Step 4: Update Stripe Webhook

- [ ] Update webhook URL to production domain
- [ ] Test webhook with Stripe CLI or test payment
- [ ] Verify webhook receives events

### Step 5: Upload Documents

Upload to Supabase Storage or your CDN:
- [ ] Main route GPX file
- [ ] Rally book PDF
- [ ] Maps
- [ ] Instructions

Update `documents` table with URLs:
```sql
INSERT INTO documents (title, file_url, file_type, category) VALUES
('Hoofdroute', 'https://...', 'gpx', 'route');
```

### Step 6: Test Production

- [ ] Visit production URL
- [ ] Homepage loads correctly
- [ ] All navigation works
- [ ] Registration form works
- [ ] Payment flow works (use test mode first!)
- [ ] Confirmation email received
- [ ] Login works with QR code
- [ ] Dashboard loads
- [ ] Documents accessible
- [ ] Rally submission works
- [ ] All images load
- [ ] Mobile responsive
- [ ] Desktop responsive

### Step 7: Switch to Live Mode

- [ ] Test one real payment (€0.50 refundable test)
- [ ] Stripe switched to live mode
- [ ] Stripe live keys updated in environment variables
- [ ] Webhook updated to use live events
- [ ] Final test registration completed

### Step 8: Go Live! 🎉

- [ ] DNS configured (if custom domain)
- [ ] SSL certificate active
- [ ] Monitoring set up (optional)
- [ ] Analytics added (optional)
- [ ] Error tracking configured (optional)
- [ ] Backup strategy in place

## Post-Launch Checklist

### Day 1
- [ ] Monitor for errors
- [ ] Check webhook events in Stripe
- [ ] Verify email delivery
- [ ] Test registration from different devices
- [ ] Check payment confirmations

### Week 1
- [ ] Review participant registrations
- [ ] Check Supabase database
- [ ] Verify all payments processed
- [ ] Test document downloads
- [ ] Collect user feedback

### Before Event
- [ ] Verify all GPX files are correct
- [ ] Test QR code scanning (if using physical scanner)
- [ ] Prepare check-in process
- [ ] Brief volunteers on system
- [ ] Have tech support ready

### During Event
- [ ] Monitor dashboard access
- [ ] Watch for technical issues
- [ ] Support participants with login issues
- [ ] Track rally submissions

### After Event
- [ ] Export participant data
- [ ] Calculate final leaderboard
- [ ] Announce Deur den Bocht
- [ ] Send thank you emails
- [ ] Archive event data

## Emergency Contacts

**Technical Issues:**
- Vercel Status: https://vercel-status.com
- Supabase Status: https://status.supabase.com
- Stripe Status: https://status.stripe.com

**Support:**
- Supabase: support@supabase.io
- Stripe: support@stripe.com
- Vercel: support@vercel.com

## Rollback Plan

If something goes wrong:

1. **Revert code**: Roll back to previous deployment
2. **Database**: Have backup ready to restore
3. **Payments**: Contact Stripe support immediately
4. **Participants**: Send notification email

## Success Metrics

Track these after launch:
- [ ] Total registrations
- [ ] Payment success rate
- [ ] Average time to complete registration
- [ ] Login success rate
- [ ] Dashboard access rate
- [ ] Rally submission rate
- [ ] Mobile vs desktop usage
- [ ] Most popular formula (meals vs breakfast)

## Notes

Add any deployment-specific notes here:

---

**Last Updated:** [Date]  
**Deployed By:** [Name]  
**Deployment Date:** [Date]  
**Production URL:** [URL]

---

Good luck with your deployment! 🏍💨
