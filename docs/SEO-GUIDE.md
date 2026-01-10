# SEO Configuration Guide

## Current SEO Status

### 🔒 Protection Enabled
Your site is currently **protected from search engine indexing**:

- ✅ **noIndex: ENABLED** - Search engines will NOT index the site
- ✅ **noFollow: ENABLED** - Search engines will NOT follow links
- ✅ **robots.txt**: Configured to disallow all crawlers
- ✅ **Meta robots tags**: Set on all pages

This protection is **ACTIVE** until you manually disable it in Sanity Studio.

## SEO Features

### 1. Meta Tags
All pages include comprehensive meta tags:
- **Title**: Customizable per page, max 60 characters
- **Description**: Customizable, max 160 characters
- **Open Graph**: For social media sharing (Facebook, LinkedIn)
- **Twitter Cards**: For Twitter/X sharing
- **Robots**: Dynamic noindex/nofollow control

### 2. Dynamic robots.txt
Located at: `/robots.txt`

**When noIndex is ENABLED (current state):**
```txt
User-agent: *
Disallow: /
```

**When noIndex is DISABLED (ready for launch):**
```txt
User-agent: *
Allow: /

Sitemap: https://yoursite.com/sitemap.xml
```

### 3. Sitemap
Located at: `/sitemap.xml`

Automatically includes all main routes:
- Homepage (/)
- About (/about)
- Rally (/rally)
- Registration (/registration)
- Login (/login)

**Note**: Sitemap returns 404 while noIndex is enabled.

## Managing SEO Settings

### In Sanity Studio

1. **Go to Sanity Studio**
   - Visit: [https://deurdenbochtrally.sanity.studio](https://deurdenbochtrally.sanity.studio)
   - Login with your credentials

2. **Open Site Configuration**
   - Click "Site Configuration" in the sidebar
   - You'll see the SEO section

3. **Available SEO Fields**

   #### SEO Title
   - **Purpose**: Main title tag for search engines
   - **Character Limit**: 60 characters
   - **Tip**: Include main keyword and year
   - **Example**: "Den Bochtenkoning Rally 2026 | Motordag Aalter"

   #### SEO Description
   - **Purpose**: Meta description shown in search results
   - **Character Limit**: 160 characters
   - **Tip**: Include action words, location, and date
   - **Example**: "Een unieke 500+ km motordag door België, Noord-Frankrijk en de Ardennen. Geen race, geen tijdsdruk. 16 mei 2026. Start & Finish: café Belami, Aalter."

   #### SEO Share Image
   - **Purpose**: Image shown when sharing on social media
   - **Recommended Size**: 1200x630 pixels
   - **Format**: JPG or PNG
   - **Tip**: Include event name, date, and visuals

   #### No Index
   - **Current**: ✅ ENABLED (checked)
   - **Purpose**: Prevents search engines from indexing the site
   - **When to disable**: When site is ready for public launch

   #### No Follow
   - **Current**: ✅ ENABLED (checked)
   - **Purpose**: Prevents search engines from following links
   - **When to disable**: When site is ready for public launch

4. **Save Changes**
   - Click "Publish" to apply changes immediately
   - Changes take effect within seconds

## Launch Checklist (When Ready)

### Pre-Launch SEO Setup

- [ ] **Add SEO Title** in Sanity Studio
  - Unique, descriptive, includes year
  - Max 60 characters

- [ ] **Add SEO Description**
  - Compelling description with keywords
  - Includes date, location, unique selling points
  - Max 160 characters

- [ ] **Upload SEO Share Image**
  - Professional design
  - 1200x630 pixels
  - Includes event branding

- [ ] **Verify Content**
  - All pages have unique, quality content
  - No placeholder text remains
  - Images have alt text

- [ ] **Test Mobile Experience**
  - All pages responsive
  - Touch targets adequate size
  - Text readable without zooming

### Launch Day

1. **Disable SEO Protection**
   - Go to Sanity Studio → Site Configuration
   - Uncheck "No Index"
   - Uncheck "No Follow"
   - Click "Publish"

2. **Verify Changes**
   ```bash
   # Check robots.txt
   curl https://yoursite.com/robots.txt
   # Should show: User-agent: * / Allow: /
   
   # Check sitemap
   curl https://yoursite.com/sitemap.xml
   # Should return XML sitemap
   
   # Check meta tags
   # View page source and look for:
   # <meta name="robots" content="...">
   # Should NOT contain "noindex" or "nofollow"
   ```

3. **Submit to Search Engines**
   - **Google Search Console**
     1. Add property: https://yoursite.com
     2. Verify ownership
     3. Submit sitemap: https://yoursite.com/sitemap.xml
   
   - **Bing Webmaster Tools**
     1. Add site
     2. Verify ownership
     3. Submit sitemap

### Post-Launch Monitoring

- [ ] Check Google Search Console weekly
- [ ] Monitor indexing status
- [ ] Review search queries
- [ ] Track Core Web Vitals
- [ ] Fix any crawl errors

## Best Practices

### Title Tags
- Include primary keyword
- Add year for timeliness
- Keep under 60 characters
- Make it unique and descriptive

**Good Examples:**
- ✅ "Den Bochtenkoning Rally 2026 | Motordag Aalter"
- ✅ "Motordag 2026 | 500km België & Ardennen | Deur Den Bocht"

**Bad Examples:**
- ❌ "Home | Deur Den Bocht" (too generic)
- ❌ "Den Bochtenkoning Rally 2026 - Een unieke motorervaring..." (too long)

### Meta Descriptions
- Summarize page content
- Include call-to-action
- Add location and date
- Keep under 160 characters

**Good Example:**
✅ "Rijd mee op 16 mei 2026! 500+ km door België en de Ardennen. Geen race, gewoon pure rijvreugde. Inschrijven vanaf €10. Start: café Belami, Aalter."

**Bad Example:**
❌ "Welkom op onze website waar we motorritten organiseren." (too vague)

### Images
- Use descriptive file names: `rally-start-cafe-belami.jpg`
- Add alt text for accessibility and SEO
- Optimize file sizes (compress before upload)
- Use WebP format when possible

### Content Strategy
1. **Homepage**: Overview, key dates, CTA
2. **About**: Event history, organizers, mission
3. **Rally**: Detailed route info, rally zones
4. **Registration**: Clear pricing, process, FAQ

## Technical SEO

### Implemented Features
- ✅ Semantic HTML structure
- ✅ Mobile-responsive design
- ✅ Fast loading times (Vercel CDN)
- ✅ HTTPS enabled by default
- ✅ Structured data ready (can be added)
- ✅ Clean URLs (no query parameters)
- ✅ XML sitemap
- ✅ robots.txt

### Future Enhancements
Consider adding:
- **Structured Data** (JSON-LD)
  - Event schema for rich snippets
  - Breadcrumb navigation
  - Organization schema

- **Additional Meta Tags**
  - Canonical URLs
  - Language alternatives (if multi-language)
  - Author information

## Monitoring Tools

### Essential Tools
1. **Google Search Console**
   - Monitor indexing
   - See search queries
   - Fix errors
   - Submit sitemap

2. **Google Analytics** (if added)
   - Track visitors
   - Monitor conversions
   - Analyze traffic sources

3. **PageSpeed Insights**
   - Check performance
   - Core Web Vitals
   - Mobile-friendliness

### Quick Health Check

```bash
# Test robots.txt
curl https://yoursite.com/robots.txt

# Test sitemap
curl https://yoursite.com/sitemap.xml

# Check meta tags (view source)
curl -s https://yoursite.com | grep -i "meta name=\"robots\""
curl -s https://yoursite.com | grep -i "og:title"
```

## Common Issues & Solutions

### Issue: Site Not Appearing in Google
**Cause**: noIndex still enabled
**Solution**: Disable in Sanity Studio → Site Configuration

### Issue: Old Meta Tags Showing
**Cause**: Browser cache
**Solution**: Hard refresh (Cmd+Shift+R) or clear cache

### Issue: Sitemap 404
**Cause**: noIndex enabled or route not found
**Solution**: Disable noIndex, redeploy if needed

### Issue: Wrong Description in Search Results
**Cause**: Google may use other content if meta description isn't ideal
**Solution**: Improve meta description, wait for re-crawl

## Support

For SEO questions or issues:
1. Check this guide first
2. Review [Vercel SEO docs](https://vercel.com/docs/concepts/edge-network/headers#seo)
3. Consult [Sanity SEO guide](https://www.sanity.io/guides/seo)
4. Test with [Google Search Console](https://search.google.com/search-console)

---

**Last Updated**: January 10, 2026
**Status**: 🔒 SEO Protection ACTIVE (noindex/nofollow enabled)
**Next Action**: Disable protection when ready to launch!
