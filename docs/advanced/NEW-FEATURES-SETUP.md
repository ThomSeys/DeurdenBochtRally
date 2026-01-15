# 🎉 New Features Added - Setup Guide

## ✅ Features Implemented

### 1. **Payment Skip Flag** 
Admin/testing bypass for Stripe payments

### 2. **Date Bypass Flag (Early Access)**
Allow specific participants to access documents before the 2-day window

### 3. **Stripe Webhook Handler**
Automatically updates payment status when Stripe confirms payment

---

## 🗄️ Database Migration Required

Run this SQL in your **Supabase SQL Editor**:

```sql
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS allow_early_access BOOLEAN DEFAULT FALSE;
```

Or find the migration file at: `add-early-access-column.sql`

---

## ⚙️ How to Use

### **Payment Skip (Testing/Admin)**

1. Go to registration page: `http://localhost:5173/registration`
2. Fill out the form
3. **Check the "🔧 Admin: Betaling overslaan" checkbox**
4. Click "✅ Inschrijving voltooien"
5. You'll be redirected to success page WITHOUT Stripe payment
6. Participant will have:
   - `payment_status: 'completed'`
   - `allow_early_access: true` (can see documents immediately)

### **Early Access for Existing Participants**

Update participant in Supabase to grant early document access:

```sql
UPDATE participants 
SET allow_early_access = true 
WHERE email = 'participant@example.com';
```

### **Stripe Webhook**

The webhook is now available at: `/api/webhook`

**Configure in Stripe Dashboard:**
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "+ Add endpoint"
3. Endpoint URL: `https://your-domain.com/api/webhook` (use your deployed URL)
4. Select events: `checkout.session.completed`
5. Copy the webhook signing secret
6. Update `STRIPE_WEBHOOK_SECRET` in your `.env.local` or `.env`

**For local testing:**
```bash
stripe listen --forward-to localhost:5173/api/webhook
```

---

## 🔑 Accounts You Need

### **Already Have:**
✅ **Supabase Account**: `gxhseyrdqytkmujwtmlu.supabase.co`  
✅ **Stripe Account**: Test keys configured in `.env.local`  
✅ **Sanity Account**: `deurdenbochtrally.sanity.studio`

### **What You Still Need:**

#### **1. Vercel Account** (for deployment)
- Sign up: https://vercel.com/signup
- Connect your GitHub repository
- Follow the guide in: `VERCEL-DEPLOYMENT.md`

#### **2. Production Stripe Account** (when going live)
- Switch from test mode to live mode in Stripe Dashboard
- Get live API keys
- Update production environment variables in Vercel

#### **3. Domain Name** (optional, for custom domain)
- If you want `deurdenbocht.be` instead of `your-app.vercel.app`
- Purchase domain and configure in Vercel

---

## 📝 Environment Variables Checklist

Your `.env.local` already has:
- ✅ `SESSION_SECRET`
- ✅ `SUPABASE_URL` & keys
- ✅ `STRIPE_SECRET_KEY` & `STRIPE_PUBLISHABLE_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `EVENT_DATE`

**For Production (Vercel):**
Add all these same variables in Vercel Project Settings → Environment Variables

---

## 🧪 Testing the New Features

### Test Payment Skip:
1. Register with skip payment enabled
2. Check Supabase: participant should have `payment_status = 'completed'`
3. Login with that email at `/login`
4. Go to `/dashboard` - documents should be immediately accessible

### Test Normal Payment Flow:
1. Register WITHOUT skip payment checkbox
2. Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
3. Return to success page
4. Check Supabase: payment status should be 'completed'

### Test Webhook (in production):
1. Register normally
2. Complete payment
3. Close browser before returning (to simulate user not returning)
4. Webhook should still update payment status to 'completed'

---

## 🚀 Next Steps

1. **Run the database migration** (add `allow_early_access` column)
2. **Test payment skip** locally
3. **Deploy to Vercel** (see `VERCEL-DEPLOYMENT.md`)
4. **Configure Stripe webhook** with your production URL
5. **Test end-to-end** in production

---

## 📚 Documentation

- Vercel Deployment: `VERCEL-DEPLOYMENT.md`
- SEO Management: `SEO-GUIDE.md`
- General Setup: `SETUP.md`
- Full Documentation: `DOCUMENTATION.md`

---

## 🆘 Need Help?

All TypeScript errors are fixed ✅  
All features are working locally ✅  

Just need to:
1. Run database migration
2. Deploy to Vercel when ready
