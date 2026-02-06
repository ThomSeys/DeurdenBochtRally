import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Root
  index("routes/_index.tsx"),
  
  // Public pages
  route("about", "routes/about.tsx"),
  route("achievements", "routes/achievements.tsx"),
  // route("certificates/:type", "routes/certificates.$type.tsx"), // REMOVED - Concept A only
  route("cookie-policy", "routes/cookie-policy.tsx"),
  route("event-albums", "routes/event-albums.tsx"),
  route("gallery", "routes/gallery.tsx"),
  route("live-map", "routes/live-map.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("privacy-policy", "routes/privacy-policy.tsx"),
  route("rally", "routes/rally.tsx"),
  route("site-access", "routes/site-access.tsx"),
  route("terms", "routes/terms.tsx"),
  route("zone/:zoneId", "routes/zone.$zoneId.tsx"), // Concept B: QR check-in/checkout
  
  // Registration
  route("registration", "routes/registration._index.tsx"),
  route("registration/success", "routes/registration.success.tsx"),
  
  // Dashboard
  route("dashboard", "routes/dashboard._index.tsx"),
  route("dashboard/blog", "routes/dashboard.blog.tsx"),
  route("dashboard/blog/new", "routes/dashboard.blog.new.tsx"),
  route("dashboard/blog/:slug", "routes/dashboard.blog.$slug.tsx"),
  route("dashboard/notification-history", "routes/dashboard.notification-history.tsx"),
  route("dashboard/privacy", "routes/dashboard.privacy.tsx"),
  route("dashboard/rally-submission", "routes/dashboard.rally-submission.tsx"),
  route("dashboard/profile-edit", "routes/dashboard.profile-edit.tsx"),
  route("dashboard/checklist", "routes/dashboard.checklist.tsx"),
  route("dashboard/emergency-contacts", "routes/dashboard.emergency-contacts.tsx"),
  route("dashboard/riding-buddies", "routes/dashboard.riding-buddies.tsx"),
  route("dashboard/buddies/:buddyId", "routes/dashboard.buddies.$buddyId.tsx"),
  
  // Zones
  
  // Check-in
  route("check-in/:participantId", "routes/check-in.$participantId.tsx"),
  
  // Admin
  route("admin", "routes/admin._index.tsx"),
  route("admin/achievements", "routes/admin.achievements.tsx"),
  route("admin/audit-log", "routes/admin.audit-log.tsx"),
  route("admin/blog", "routes/admin.blog.tsx"),
  route("admin/buddy-stats", "routes/admin.buddy-stats.tsx"),
  route("admin/challenges", "routes/admin.challenges.tsx"),
  route("admin/check-in", "routes/admin.check-in.tsx"),
  route("admin/emergency-alerts", "routes/admin.emergency-alerts.tsx"),
  route("admin/emergency-contact-dashboard", "routes/admin.emergency-contact-dashboard.tsx"),
  route("admin/event-checklist", "routes/admin.event-checklist.tsx"),
  route("admin/event-dashboard", "routes/admin.event-dashboard.tsx"),
  route("admin/event-markers", "routes/admin.event-markers.tsx"),
  route("admin/fallback-review", "routes/admin.fallback-review.tsx"),
  route("admin/financial-report", "routes/admin.financial-report.tsx"),
  route("admin/gallery", "routes/admin.gallery.tsx"),
  route("admin/logs", "routes/admin.logs.tsx"),
  route("admin/manual-scan", "routes/admin.manual-scan.tsx"),
  route("admin/participants", "routes/admin.participants.tsx"),
  route("admin/participants/:participantId/submissions", "routes/admin.participants.$participantId.submissions.tsx"),
  route("admin/participants/:participantId/timeline", "routes/admin.participants.$participantId.timeline.tsx"),
  route("admin/pending-scans", "routes/admin.pending-scans.tsx"),
  route("admin/photo-albums", "routes/admin.photo-albums.tsx"),
  route("admin/prepare-edition", "routes/admin.prepare-edition.tsx"),
  route("admin/push-notifications", "routes/admin.push-notifications.tsx"),
  route("admin/reports", "routes/dashboard.admin.reports.tsx"),
  route("admin/settings", "routes/admin.settings.tsx"),
  route("admin/submissions", "routes/admin.submissions.tsx"),
  route("admin/zone-control", "routes/admin.zone-control.tsx"),
  
  // API
  route("api/challenges/submit", "routes/api.challenges.submit.ts"),
  route("api/challenges/validate", "routes/api.challenges.validate.ts"),
  route("api/check-ins", "routes/api.check-ins.tsx"),
  route("api/delete-account", "routes/api.delete-account.tsx"),
  route("api/download-data", "routes/api.download-data.tsx"), // GDPR data export
  route("api/event-markers", "routes/api.event-markers.tsx"),
  route("api/events/submit", "routes/api.events.submit.tsx"),
  route("api/gpx-route", "routes/api.gpx-route.tsx"),
  route("api/prepare-edition", "routes/api.prepare-edition.tsx"),
  route("api/process-reports", "routes/api.process-reports.ts"),
  route("api/push-send", "routes/api.push-send.tsx"),
  route("api/push-subscribe", "routes/api.push-subscribe.tsx"),
  route("api/qrcode", "routes/api.qrcode.tsx"),
  // route("api/rally-submission", "routes/api.rally-submission.tsx"), // REMOVED - Concept A only
  route("api/rally-zones", "routes/api.rally-zones.tsx"),
  route("api/riding-buddies", "routes/api.riding-buddies.tsx"),
  // route("api/shadow-recalculate", "routes/api.shadow-recalculate.tsx"), // REMOVED - Concept A only
  route("api/upload-photo", "routes/api.upload-photo.ts"),
  route("api/webhook", "routes/api.webhook.tsx"),
  route("api/zone-gpx/:zoneId", "routes/api.zone-gpx.$zoneId.tsx"),
  route("api/emergency-sos", "routes/api.emergency-sos.tsx"),
  route("api/admin-menu-stats", "routes/api.admin-menu-stats.tsx"),
] satisfies RouteConfig;
