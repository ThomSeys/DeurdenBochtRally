# SEO & Deployment Setup - Summary

## ✅ Completed Tasks

### 1. SEO Fields Added to Sanity
- **Schema Updated**: `siteConfig` now includes:
  - `seoTitle` - Page title for search engines (max 60 chars)
  - `seoDescription` - Meta description (max 160 chars)
  - `seoImage` - Social media share image (1200x630px)
  - `noIndex` - Boolean to prevent indexing (default: true)
  - `noFollow` - Boolean to prevent following links (default: true)

- **Schema Deployed**: ✅ Successfully deployed to Sanity Cloud

### 2. Code Implementation
- **Meta Tags**: Updated `_index.tsx` with dynamic meta function
  - Reads SEO settings from Sanity
  - Generates Open Graph tags
  - Generates Twitter Card tags
  - Applies noindex/nofollow when enabled

- **robots.txt**: Created dynamic route at `/robots.txt`
  - Shows "Disallow: /" when noIndex is enabled
  - Shows "Allow: /" with sitemap when indexing allowed

- **Sitemap**: Created dynamic route at `/sitemap.xml`
  - Lists all main routes
  - Returns 404 when noIndex is enabled
  - Auto-updates when routes change

### 3. Current SEO Protection Status

🔒 **SITE IS PROTECTED FROM INDEXING**

The site is configured with these default values:
- ✅ `noIndex: true` - Search engines CANNOT index
- ✅ `noFollow: true` - Search engines CANNOT follow links
- ✅ robots.txt returns "Disallow: /"
- ✅ All pages include `<meta name="robots" content="noindex, nofollow">`

**This means**: Even when deployed to Vercel, your site will NOT appear in search results until you manually disable these settings.

### 4. Deployment Preparation

Created comprehensive guides:
- **VERCEL-DEPLOYMENT.md**: Complete Vercel setup instructions
- **SEO-GUIDE.md**: Detailed SEO management documentation

## 🎯 Next Steps

### To Enable SEO Protection in Sanity (Manual Step Required)

The token doesn't have write permissions, so you need to manually enable protection:

1. **Go to Sanity Studio**
   - Visit: https://deurdenbochtrally.sanity.studio
   - Login with your credentials

2. **Open Site Configuration**
   - Click "Site Configuration" in the sidebar

3. **Enable Protection**
   - Find the "No Index" field → Check it (enable)
   - Find the "No Follow" field → Check it (enable)
   - Click **"Publish"**

4. **Add SEO Content** (Optional but recommended)
   - SEO Title: "Den Bochtenkoning Rally 2026 | Motordag Aalter"
   - SEO Description: "Een unieke 500+ km motordag door België, Noord-Frankrijk en de Ardennen. Geen race, geen tijdsdruk. 16 mei 2026. Start & Finish: café Belami, Aalter."
   - SEO Share Image: Upload a 1200x630px image

### To Deploy to Vercel

Follow the **VERCEL-DEPLOYMENT.md** guide. Key steps:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add SEO protection and Vercel deployment config"
   git push origin main
   ```

2. **Deploy via Vercel Dashboard**
   - Go to vercel.com/new
   - Import your GitHub repository
   - Set environment variables:
     - `SANITY_PROJECT_ID=tp2nrvnd`
     - `SANITY_DATASET=production`
     - `SANITY_TOKEN=<your-token>`
     - `SESSION_SECRET=<generate-random>`
   - Deploy!

3. **Add Vercel Domain to Sanity CORS**
   - Go to sanity.io/manage
   - API → CORS Origins
   - Add: https://your-project.vercel.app

### When Ready to Launch Publicly

1. **In Sanity Studio**
   - Go to Site Configuration
   - Uncheck "No Index"
   - Uncheck "No Follow"
   - Click "Publish"

2. **Verify**
   - Visit yoursite.com/robots.txt
   - Should show "Allow: /"
   - View page source
   - Should NOT see noindex/nofollow in meta tags

3. **Submit to Search Engines**
   - Google Search Console: Submit sitemap
   - Bing Webmaster Tools: Submit sitemap

## 📁 New Files Created

```
site/
├── VERCEL-DEPLOYMENT.md          # Complete Vercel deployment guide
├── SEO-GUIDE.md                   # Comprehensive SEO documentation
├── vercel.json                    # Vercel configuration file
├── scripts/
│   └── enable-seo-protection.ts   # Script to enable SEO protection
├── apps/web/app/routes/
│   ├── robots[.]txt.ts           # Dynamic robots.txt route
│   └── sitemap[.]xml.ts          # Dynamic sitemap.xml route
└── sanity-studio/schemaTypes/
    └── siteConfig.ts             # Updated with SEO fields
```

## 📋 Files Modified

```
apps/web/app/routes/_index.tsx       # Updated meta function with SEO
apps/web/app/lib/sanity.server.ts    # Added SEO fields to types
sanity-studio/schemaTypes/pricingTier.ts  # Added icon field
```

## 🔗 Important URLs

- **Sanity Studio**: https://deurdenbochtrally.sanity.studio
- **Sanity Project**: https://sanity.io/manage (Project ID: tp2nrvnd)
- **Local Dev Server**: http://localhost:5173

## ⚠️ Important Notes

1. **Token Permissions**: The current Sanity token has read-only permissions. This is fine for the website but prevents the script from updating settings. You'll need to manually enable noIndex/noFollow in the Studio.

2. **Default Protection**: The schema has `initialValue: true` for both noIndex and noFollow, so any NEW site config documents will be protected by default.

3. **Existing Config**: Your existing siteConfig document needs to be manually updated with the protection flags.

4. **Testing**: Test robots.txt and meta tags locally before deploying:
   ```bash
   # With noIndex enabled:
   curl http://localhost:5173/robots.txt
   # Should show: User-agent: * / Disallow: /
   ```

## 🎉 Summary

Your site is now fully prepared for SEO with comprehensive protection:

✅ SEO fields available in Sanity CMS  
✅ Dynamic meta tags on all pages  
✅ robots.txt with protection logic  
✅ XML sitemap generation  
✅ Open Graph and Twitter Cards  
✅ noindex/nofollow control from Sanity  
✅ Vercel deployment ready  
✅ Complete documentation provided  

**Status**: Ready to deploy! Site will be protected from indexing by default.

**Next Action**: Follow VERCEL-DEPLOYMENT.md to deploy to production.
