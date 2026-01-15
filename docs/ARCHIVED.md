# Archived Documentation

This file documents older, completed, or deprecated documentation files.

## Cleanup performed: January 15, 2026

### Removed from Active Documentation

The following files were archived because they document completed implementations or are superseded by newer guides:

**Feature Completion Documents** (Historical Reference)
- `DYNAMIC-CONTENT-COMPLETE.md` - Completed feature
- `EDITION-AWARE-SETUP-COMPLETE.md` - Completed feature
- `OFFLINE-SETUP-COMPLETE.md` - Completed feature
- `PWA-OFFLINE-COMPLETE.md` - Completed but referenced in active docs
- `DYNAMIC-CONTENT-MIGRATION.md` - Migration completed
- `NEW-FEATURES-SETUP.md` - Setup completed
- `PHOTO-UPLOAD-SETUP.md` - Setup completed

**Setup & Configuration** (Archived)
- `DIRECTUS-SETUP.md` - Deprecated CMS
- `ADD-HOMEPAGE-CONTENT.md` - One-off content guide
- `COOKIE-CONSENT.md` - Deprecated feature
- `SEO-DEPLOYMENT-SUMMARY.md` - Initial SEO setup
- `SEO-GUIDE.md` - General SEO documentation
- `DOCUMENTATION.md` - Index (replaced by INDEX.md)
- `explanation.md` - Miscellaneous notes

**Deployment & Migration** (Archived)
- `APPLY-MIGRATION.md` - Specific migration applied
- `DEPLOYMENT-CHECKLIST-OFFLINE.md` - Offline-specific (archived)
- `OFFLINE-INTEGRATION-FILES.md` - Integration notes
- `OFFLINE-BUILD-SUMMARY.txt` - Build summary
- `TYPE-SYNC-SUMMARY.md` - Type synchronization
- `TYPE-FIXES-COMPLETE.md` - Type fixes documentation
- `ENHANCED-FEATURES-GUIDE.md` - Feature guide (archived)
- `ENHANCED-FEATURES-SETUP.md` - Setup completed
- `ENHANCED-FEATURES-SUMMARY.md` - Implementation summary
- `EMAIL_SETUP.md` - Email configuration
- `PHOTO-UPLOAD-UPDATE.md` - Update notes
- `README-OFFLINE.md` - Offline README

## Current File Structure

```
docs/
├── INDEX.md                          # START HERE - Documentation index
├── QUICKSTART.md                     # 5-minute setup
├── SETUP.md                          # Full installation guide
├── DEPLOYMENT.md                     # Production deployment
├── TROUBLESHOOTING.md                # Common issues & solutions
├── FEATURES.md                       # Feature overview
├── CONTENT-MANAGEMENT.md             # Managing content
├── SANITY-SETUP.md                  # Sanity CMS configuration
├── GPS-CAPTURE-GUIDE.md              # GPS functionality
├── RALLY-SCENARIOS-IMPLEMENTATION.md # Rally code system
├── RALLY-VALIDATION.md               # Data validation
├── QR-CODE-STORAGE.md               # QR code system
├── PWA-OFFLINE-COMPLETE.md          # Offline functionality
├── OFFLINE-DATA-HANDLING.md          # Data sync strategies
├── PUSH-NOTIFICATIONS-IMPLEMENTATION.md
├── PUSH-NOTIFICATIONS-CODE-EXAMPLES.md
├── PUSH-NOTIFICATIONS-TRACKING.md    # Push notification tracking
├── VERCEL-DEPLOYMENT.md              # Vercel specifics
├── LIVE-MAP-FEATURE.md               # Live map system
├── RALLY-SCENARIOS-ANALYSIS.md       # Rally analysis
├── OFFLINE-QUICK-START.md            # Quick offline guide
├── README.md                         # Original overview
├── ARCHIVED.md                       # This file
├── INDEX.md                          # Documentation index
└── DEPLOYMENT-CHECKLIST.md           # Deployment checklist
```

## How to Use This Archive

If you need information about:
- **Completed features** → See the `-COMPLETE.md` or `-SUMMARY.md` versions
- **Historical setup** → See `-SETUP.md` or `*-GUIDE.md` files
- **Database migrations** → See `APPLY-MIGRATION.md` or similar

For current development, always refer to the files listed in `INDEX.md`.

## Future Cleanup

Consider quarterly reviews to:
1. Remove truly obsolete files
2. Consolidate overlapping guides
3. Update outdated references
4. Archive new completed features
