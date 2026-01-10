# Email & QR Code Setup

## Environment Variables

Add these to your `.env` file and Vercel environment variables:

```bash
# Resend Email Service (Using Test Domain - No Verification Required!)
RESEND_API_KEY=re_xxxxxxxxxxxxx
APP_URL=https://your-domain.com
```

## Setting Up Resend with Test Domain

### Step 1: Create Resend Account
1. Sign up at [https://resend.com](https://resend.com)
2. No credit card required for the free tier

### Step 2: Get API Key
1. Go to **API Keys** in the Resend dashboard
2. Click **Create API Key**
3. Give it a name (e.g., "Deur Den Bocht")
4. Copy the API key (starts with `re_`)

### Step 3: Add to Environment Variables
```bash
RESEND_API_KEY=re_abcdefghijklmnop
APP_URL=https://deurdenbocht.vercel.app
```

### Step 4: Use Test Domain (No Verification!)
The code is already configured to use `onboarding@resend.dev` - Resend's free test domain that requires **no verification**.

Emails will come from: **Deur Den Bocht <onboarding@resend.dev>**

## Free Tier Limits
- ✅ **3,000 emails/month** - plenty for your event
- ✅ **No domain verification required** with test domain
- ✅ **No credit card required**
- ✅ Works immediately after setup

## Upgrading to Custom Domain (Optional - Later)
When you have a domain and want emails from `@deurdenbocht.be`:
1. Add and verify your domain in Resend
2. Update the `from` address in [email.server.ts](apps/web/app/lib/email.server.ts#L55)
3. Change from `onboarding@resend.dev` to `noreply@deurdenbocht.be`

## Features Implemented

### 1. Registration Confirmation Emails
- ✅ Automatically sent when payment is completed (via Stripe webhook)
- ✅ Includes embedded QR code image
- ✅ Contains participant details
- ✅ Link to dashboard

### 2. QR Code Validation API
- ✅ Endpoint: `GET /api/validate-qr?id=UUID&email=encoded`
- ✅ Works with native camera apps (URL-based QR codes)
- ✅ Validates participant data
- ✅ Checks payment status
- ✅ Updates checked_in flag in database
- ✅ Redirects to success page

**QR Code Format:**
```
https://your-domain.com/api/validate-qr?id=abc-123&email=john%40example.com
```
    "paymentStatus": "completed"
  },
  "message": "✅ Deelnemer geverifieerd en betaald"
}
```

### 3. Contact Form
- ✅ Page: `/contact`
- ✅ Sends emails to contact address from Sanity
- ✅ Auto-fills user data if logged in
- ✅ Reply-to set to sender's email

### 4. QR Scanner Page
- ✅ Page: `/scanner`
- ✅ Manual QR data input
- ✅ Validates via API
- ✅ Shows participant details
- 🔄 Camera scanning can be added with `html5-qrcode` or `react-qr-reader`

## Testing Emails in Development

For testing, you can use Resend's test mode which doesn't require domain verification:

```bash
# In development, emails will be sent but marked as test
EMAIL_FROM=onboarding@resend.dev
```

## Adding Camera-Based QR Scanning

To enable camera scanning on the `/scanner` page:

```bash
npm install html5-qrcode
```

Then update the scanner.tsx component to use the Html5QrcodeScanner.

## Vercel Environment Variables

Make sure to add these in Vercel:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add: `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`
4. Redeploy

## Email Templates

Email templates are defined in `/app/lib/email.server.ts`:
- `sendRegistrationConfirmationEmail()` - Sent after payment
- `sendContactFormEmail()` - Sent from contact form

Both use inline CSS for maximum email client compatibility.
