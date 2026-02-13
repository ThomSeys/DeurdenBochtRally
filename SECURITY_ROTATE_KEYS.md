# Action: Rotate exposed keys and remove secrets from repo

We've detected several production keys committed to the repository. These must be rotated immediately and the committed files removed from git.

Steps to perform now (urgent):

1. Rotate all exposed keys/secrets immediately (do this before or in parallel with git cleanup):
   - Stripe secret keys (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
   - Supabase service role key (SUPABASE_SERVICE_ROLE_KEY)
   - Sanity tokens (SANITY_TOKEN, SANITY_WRITE_TOKEN)
   - Resend API key (RESEND_API_KEY)
   - VAPID_PRIVATE_KEY
   - Vercel OIDC token (VERCEL_OIDC_TOKEN)

2. Replace values in your secret manager (Vercel Environment Variables, or a vault). Do NOT re-commit any secret files.

3. Remove committed env files from git and ensure they are in `.gitignore` (this repo already lists .env files).
   - Files removed from this repo: `.env.vercel`, `apps/web/.env.local`

4. If the keys were public (pushed to a public remote), consider rotating any keys that may have been leaked even if not in the files above.

5. If you need help rotating specific providers' keys, I can generate exact command examples per provider.

Notes:
- After rotating keys, redeploy services using the new secrets.
- Consider running BFG or `git filter-repo` to scrub old secrets from history if these were committed to a public repo.
