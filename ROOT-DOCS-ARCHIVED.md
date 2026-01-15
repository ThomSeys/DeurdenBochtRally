# Root Documentation - Archived

This file consolidates archived documentation files from the project root.

## Files Archived (January 15, 2026)

These files were moved from the project root to clean up the directory structure. Refer to `docs/` for active documentation.

### Type & Sync Documentation
- **TYPE-SYNC-SUMMARY.md** - TypeScript type synchronization summary
- **TYPE-FIXES-COMPLETE.md** - Completion report for type fixes

### Setup & Configuration (Completed)
- **APPLY-MIGRATION.md** - Database migration notes
- **EMAIL_SETUP.md** - Email configuration
- **OFFLINE-SETUP-COMPLETE.md** - Offline PWA setup completion
- **ENHANCED-FEATURES-SETUP.md** - Enhanced features configuration
- **ENHANCED-FEATURES-SUMMARY.md** - Feature implementation summary
- **ENHANCED-FEATURES-GUIDE.md** - Feature implementation guide
- **OFFLINE-BUILD-SUMMARY.txt** - Build process summary
- **DEPLOYMENT-CHECKLIST-OFFLINE.md** - Offline deployment checklist
- **README-OFFLINE.md** - Offline mode README

### Feature Documentation
- **PHOTO-UPLOAD-UPDATE.md** - Photo upload feature updates
- **PUSH-NOTIFICATIONS-FEATURE-SUMMARY.md** - Feature summary
- **PUSH-NOTIFICATIONS-SETUP-READY.md** - Setup completion status
- **PUSH-NOTIFICATIONS-QUICKSTART.txt** - Quick reference

## New Root Structure

Only essential files remain in project root:
```
site/
├── package.json                     # Dependencies
├── turbo.json                       # Turbo configuration
├── vercel.json                      # Vercel deployment
├── .env.enhanced-features          # Env template
├── setup-db.sh                     # Database setup script
├── setup-enhanced-features.sh      # Feature setup script
├── docs/                           # See INDEX.md for guide
├── apps/                           # Application code
├── sanity-studio/                  # CMS studio
└── scripts/                        # Utility scripts
```

## Notes

- All active documentation is in `docs/` directory
- Start with `docs/INDEX.md` for navigation
- See `docs/ARCHIVED.md` for full documentation archive

For development:
- Backend: `apps/web/` (React Router app)
- CMS: `sanity-studio/` (Sanity Studio)
- Setup: Follow `docs/QUICKSTART.md` or `docs/SETUP.md`
