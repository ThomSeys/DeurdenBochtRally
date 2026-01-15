# Deploying Deur Den Bocht to Vercel

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional): `npm i -g vercel`
3. **GitHub Repository**: Push your code to GitHub (recommended)

## Environment Variables

Before deploying, you need to configure these environment variables in Vercel:

### Required Variables

```bash
# Sanity CMS
SANITY_PROJECT_ID=tp2nrvnd
SANITY_DATASET=production
SANITY_TOKEN=<your-sanity-token>

# Session Secret (generate a random string)
SESSION_SECRET=<generate-random-32-char-string>

# Supabase (if using authentication)
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Stripe (if using payments)
STRIPE_PUBLIC_KEY=<your-stripe-public-key>
STRIPE_SECRET_KEY=<your-stripe-secret-key>
```

### How to Get Environment Variables

#### Sanity Token
1. Go to [sanity.io/manage](https://sanity.io/manage)
2. Select your project: "Deur Den Bocht 2026"
3. Go to **API** → **Tokens**
4. Click **Add API token**
5. Name: "Vercel Production"
6. Permissions: **Editor** (or **Viewer** if read-only)
7. Copy the token (save it securely!)

#### Session Secret
Generate a random 32-character string:
```bash
openssl rand -base64 32
```

## Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Sign in with GitHub

2. **Import Your Repository**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Remix
   - **Root Directory**: `./` (keep default)
   - **Build Command**: `cd apps/web && npm run build`
   - **Output Directory**: `apps/web/build/client`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add all variables from the list above
   - Make sure to add them for **Production**, **Preview**, and **Development**

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-5 minutes)
   - Your site will be live at `https://your-project.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Root**
   ```bash
   cd /Users/thomasseyssens/Desktop/Deur\ Den\ Bocht/2026/site
   vercel
   ```

4. **Follow the Prompts**
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (first time) or **Y** (subsequent)
   - What's your project's name? `deur-den-bocht-2026`
   - In which directory is your code located? `./`
   - Want to modify these settings? **N**

5. **Set Environment Variables**
   ```bash
   vercel env add SANITY_PROJECT_ID production
   vercel env add SANITY_DATASET production
   vercel env add SANITY_TOKEN production
   vercel env add SESSION_SECRET production
   # Add other variables as needed
   ```

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Custom Domain Setup

1. **Go to Project Settings**
   - Visit your project in Vercel Dashboard
   - Go to **Settings** → **Domains**

2. **Add Your Domain**
   - Enter: `deurdenbocht.be` or `www.deurdenbocht.be`
   - Click "Add"

3. **Configure DNS**
   - Add the following DNS records at your domain registrar:
   
   **For apex domain (deurdenbocht.be):**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```
   
   **For www subdomain:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

4. **Wait for SSL Certificate**
   - Vercel will automatically provision an SSL certificate
   - Usually takes 5-10 minutes

## SEO Protection (Important!)

Your site is currently configured with **noindex/nofollow** protection:

### Current Status
- ✅ **noIndex: ENABLED** - Search engines will NOT index your site
- ✅ **noFollow: ENABLED** - Search engines will NOT follow links
- ✅ **robots.txt**: Disallows all crawling when noIndex is enabled

### How to Enable Indexing (When Ready to Launch)

1. **Go to Sanity Studio**
   - Visit [https://deurdenbochtrally.sanity.studio](https://deurdenbochtrally.sanity.studio)

2. **Open Site Configuration**
   - Click on "Site Configuration" in the sidebar

3. **Disable Protection**
   - Uncheck "No Index"
   - Uncheck "No Follow"
   - Click "Publish"

4. **Verify**
   - Visit `https://yoursite.com/robots.txt`
   - Should now show "Allow: /"

## Automatic Deployments

Once connected to GitHub, Vercel will automatically:
- Deploy **every push to main** to production
- Deploy **pull requests** to preview URLs
- Run builds and tests

## Sanity Studio Deployment

Your Sanity Studio is already deployed at:
- [https://deurdenbochtrally.sanity.studio](https://deurdenbochtrally.sanity.studio)

No additional setup needed for the studio.

## Monitoring & Logs

1. **View Deployment Logs**
   - Go to your project in Vercel Dashboard
   - Click on a deployment
   - View build logs and runtime logs

2. **Monitor Performance**
   - Vercel provides analytics for:
     - Page views
     - Load times
     - Core Web Vitals

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify all dependencies are in package.json
- Check build logs for specific errors

### Site Shows 404
- Verify output directory is `apps/web/build/client`
- Check vercel.json configuration
- Ensure build command completed successfully

### Environment Variables Not Working
- Make sure variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding new variables
- Variables only update on new deployments

### Sanity Content Not Loading
- Verify `SANITY_PROJECT_ID` matches your project
- Check `SANITY_TOKEN` has correct permissions
- Verify `SANITY_DATASET` is set to "production"

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Check `/robots.txt` shows "Disallow: /" (noindex enabled)
- [ ] Test responsive design on mobile
- [ ] Verify Sanity content appears correctly
- [ ] Test form submissions (if applicable)
- [ ] Check all environment variables are set
- [ ] Set up custom domain (if applicable)
- [ ] Configure CORS in Sanity for your domain
- [ ] Test SEO meta tags (view page source)

## Sanity CORS Configuration

After deploying, add your Vercel domain to Sanity CORS:

1. Go to [sanity.io/manage](https://sanity.io/manage)
2. Select project: "Deur Den Bocht 2026"
3. Go to **API** → **CORS Origins**
4. Click **Add CORS origin**
5. Enter your domain: `https://your-project.vercel.app`
6. Allow credentials: **Yes**
7. Save

## Support & Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Remix on Vercel**: [vercel.com/guides/deploying-remix-with-vercel](https://vercel.com/guides/deploying-remix-with-vercel)
- **Sanity Docs**: [sanity.io/docs](https://sanity.io/docs)

---

**Need Help?**
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Community: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
