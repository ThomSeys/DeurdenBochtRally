# 🔧 Troubleshooting Guide

Common issues and solutions for the Deur Den Bocht website.

## Installation Issues

### ❌ "npm install" fails

**Problem:** Dependencies won't install

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json apps/web/node_modules

# Reinstall
npm install

# If still failing, try with legacy peer deps
npm install --legacy-peer-deps
```

### ❌ Wrong Node version

**Problem:** "Error: The engine "node" is incompatible"

**Solution:**
```bash
# Check your Node version
node --version

# Should be 18.x or higher
# Use nvm to switch versions
nvm install 18
nvm use 18
```

## Development Server Issues

### ❌ Port 5173 already in use

**Problem:** "Port 5173 is already in use"

**Solutions:**
```bash
# Find and kill the process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
PORT=3000 npm run dev
```

### ❌ Server won't start

**Problem:** Server crashes on startup

**Solutions:**
1. Check environment variables are set:
   ```bash
   cat apps/web/.env.local
   ```
2. Verify all required variables exist
3. Check for syntax errors in .env.local
4. Restart terminal/IDE

### ❌ "Module not found" errors

**Problem:** Cannot find module '@remix-run/...'

**Solutions:**
```bash
# Reinstall dependencies
cd apps/web
npm install

# Or from root
npm install
```

## Environment Variables

### ❌ Environment variables not loading

**Problem:** Variables undefined or null

**Solutions:**
1. Ensure file is named `.env.local` (not `.env`)
2. Restart dev server after changes
3. Check file is in `apps/web/` directory
4. No spaces around = sign: `KEY=value` not `KEY = value`
5. Verify quotes if needed: `KEY="value with spaces"`

### ❌ "Missing SUPABASE_URL"

**Problem:** Supabase env vars not found

**Solutions:**
1. Copy URL from Supabase Dashboard → Settings → API
2. Ensure format: `https://xxxxx.supabase.co`
3. No trailing slash
4. Restart server

## Database Issues

### ❌ Cannot connect to Supabase

**Problem:** Database queries fail

**Solutions:**
1. Verify SUPABASE_URL is correct
2. Check SUPABASE_ANON_KEY is correct
3. Ensure project is not paused (free tier)
4. Check Supabase status: https://status.supabase.com
5. Verify network/firewall settings

### ❌ Table does not exist

**Problem:** "relation 'participants' does not exist"

**Solutions:**
1. Run the SQL schema:
   ```sql
   -- In Supabase SQL Editor
   -- Copy and run supabase-schema.sql
   ```
2. Verify tables created in Table Editor
3. Check correct database selected

### ❌ Row Level Security errors

**Problem:** "new row violates row-level security policy"

**Solutions:**
1. Verify RLS policies are created
2. Check service role key for admin operations
3. Review policy conditions
4. Temporarily disable RLS for testing (not in production!)

## Payment Issues

### ❌ Stripe redirect fails

**Problem:** Clicking payment button does nothing

**Solutions:**
1. Check STRIPE_SECRET_KEY is set
2. Verify key format: `sk_test_...` or `sk_live_...`
3. Check browser console for errors
4. Ensure APP_URL is correct

### ❌ Webhook not receiving events

**Problem:** Payment completes but status not updated

**Solutions:**
1. Verify webhook URL in Stripe Dashboard
2. Check STRIPE_WEBHOOK_SECRET matches
3. Ensure webhook endpoint is accessible
4. Test with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:5173/api/webhook
   ```
5. Check webhook logs in Stripe Dashboard

### ❌ Test payments not working

**Problem:** Test card declined

**Solutions:**
1. Use correct test card: `4242 4242 4242 4242`
2. Any future expiry date
3. Any 3-digit CVC
4. Any zip code
5. Ensure using test mode keys

## Authentication Issues

### ❌ Cannot login

**Problem:** "Invalid login credentials"

**Solutions:**
1. Verify email is exact match (lowercase)
2. Check QR code is exact match
3. Ensure payment_status is 'completed':
   ```sql
   SELECT * FROM participants WHERE email = 'user@email.com';
   ```
4. Check participant exists in database

### ❌ Session not persisting

**Problem:** Logged out after refresh

**Solutions:**
1. Check SESSION_SECRET is set
2. Verify cookies are enabled in browser
3. Check secure flag in production
4. Clear browser cookies and retry

### ❌ Redirect loop

**Problem:** Keeps redirecting between pages

**Solutions:**
1. Clear browser cache
2. Check loader functions for infinite redirects
3. Verify session handling logic

## Build Issues

### ❌ TypeScript errors

**Problem:** "Type 'X' is not assignable to type 'Y'"

**Solutions:**
1. Check types match in database.types.ts
2. Run type check: `cd apps/web && npm run typecheck`
3. Verify imports are correct
4. Check for missing type definitions

### ❌ Build fails in production

**Problem:** "npm run build" fails

**Solutions:**
1. Check for unused imports
2. Verify all environment variables set
3. Fix TypeScript errors
4. Check for console.logs (if using strict mode)
5. Review build output for specific errors

## Performance Issues

### ❌ Slow page loads

**Problem:** Pages take long to load

**Solutions:**
1. Check database queries (add indexes if needed)
2. Optimize images
3. Review Supabase query performance
4. Check network tab in browser DevTools
5. Consider adding caching

### ❌ High memory usage

**Problem:** App uses too much memory

**Solutions:**
1. Check for memory leaks
2. Review database connections
3. Ensure connections are closed
4. Check for infinite loops

## Deployment Issues

### ❌ Vercel build fails

**Problem:** Deployment fails

**Solutions:**
1. Check build command is correct
2. Verify output directory setting
3. Check all env vars set in Vercel
4. Review build logs
5. Test build locally: `npm run build`

### ❌ 404 on deployed site

**Problem:** Routes not found

**Solutions:**
1. Check vercel.json configuration
2. Verify framework preset is Remix
3. Check rewrites configuration
4. Review deployment logs

### ❌ Environment variables not working in production

**Problem:** Env vars undefined in deployed site

**Solutions:**
1. Verify all vars set in deployment platform
2. Redeploy after adding vars
3. Check variable names match exactly
4. No client-side exposure of secrets

## Common Error Messages

### "NEXT_PUBLIC is not defined"

**Solution:** This is a Remix app, not Next.js. Don't use NEXT_PUBLIC prefix.

### "Cannot read property of undefined"

**Solutions:**
1. Add optional chaining: `object?.property`
2. Add null checks: `if (object) { ... }`
3. Provide default values: `const x = data || {}`

### "Network request failed"

**Solutions:**
1. Check internet connection
2. Verify API endpoints
3. Check CORS settings
4. Review network tab in DevTools

### "Hydration mismatch"

**Solutions:**
1. Ensure server and client render same HTML
2. Don't use Date.now() directly in render
3. Check for random values in render
4. Verify conditional rendering logic

## Database Queries

### Slow queries

```sql
-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_payment ON participants(payment_status);
```

### Check data

```sql
-- View all participants
SELECT * FROM participants ORDER BY created_at DESC;

-- Check payment statuses
SELECT payment_status, COUNT(*) FROM participants GROUP BY payment_status;

-- View rally submissions
SELECT p.first_name, p.last_name, rs.total_points 
FROM rally_submissions rs
JOIN participants p ON rs.participant_id = p.id
ORDER BY rs.total_points DESC;
```

## Getting Help

### Before asking for help:

1. Check this troubleshooting guide
2. Review error messages carefully
3. Check browser console
4. Review server logs
5. Try in incognito/private mode
6. Test in different browser

### When reporting issues:

Include:
- Error message (full text)
- What you were trying to do
- Steps to reproduce
- Browser/OS info
- Node version
- Relevant code snippets
- Screenshots if helpful

### Useful debugging commands:

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Check port usage
lsof -i :5173

# View environment variables (be careful with secrets!)
printenv | grep SUPABASE

# Test Supabase connection
curl https://your-project.supabase.co

# Check Remix routes
npm run routes

# TypeScript check
npm run typecheck
```

## Contact Support

- **Supabase:** https://supabase.com/support
- **Stripe:** https://support.stripe.com
- **Vercel:** https://vercel.com/support
- **Remix:** https://remix.run/docs

## Still Stuck?

If you've tried everything and still have issues:

1. Create a minimal reproduction
2. Check GitHub issues for similar problems
3. Join Remix Discord
4. Post on Stack Overflow with relevant tags
5. Contact the development team

---

**Pro Tip:** Most issues are related to:
1. Environment variables (40%)
2. Missing dependencies (25%)
3. Database schema (20%)
4. Caching issues (15%)

Good luck! 🍀
