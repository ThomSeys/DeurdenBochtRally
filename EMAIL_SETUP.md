# Email & QR Code Setup

## New Environment Variables

Add these to your `.env` file and Vercel environment variables:

```bash
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@deurdenbocht.be
APP_URL=https://your-domain.com
```

## Getting Resend API Key

1. Sign up at [https://resend.com](https://resend.com)
2. Verify your domain or use resend's test domain for development
3. Create an API key in the dashboard
4. Add the API key to your environment variables

## Features Implemented

### 1. Registration Confirmation Emails
- ✅ Automatically sent when payment is completed (via Stripe webhook)
- ✅ Includes embedded QR code image
- ✅ Contains participant details
- ✅ Link to dashboard

### 2. QR Code Validation API
- ✅ Endpoint: `POST /api/validate-qr`
- ✅ Validates participant data
- ✅ Checks payment status
- ✅ Returns participant information

**Example Request:**
```json
{
  "qrData": "Naam: John Doe\nEmail: john@example.com\nID: abc-123\nBetaald: Ja"
}
```

**Example Response:**
```json
{
  "valid": true,
  "participant": {
    "id": "abc-123",
    "name": "John Doe",
    "email": "john@example.com",
    "isPaid": true,
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
