import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Root
  index("routes/_index.tsx"),
  
  // Public pages
  route("about", "routes/about.tsx"),
  route("achievements", "routes/achievements.tsx"),
  route("certificates/:type", "routes/certificates.$type.tsx"),
  route("gallery", "routes/gallery.tsx"),
  route("live-map", "routes/live-map.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("rally", "routes/rally.tsx"),
  route("site-access", "routes/site-access.tsx"),
  
  // Registration
  route("registration", "routes/registration._index.tsx"),
  route("registration/success", "routes/registration.success.tsx"),
  
  // Dashboard
  route("dashboard", "routes/dashboard._index.tsx"),
  route("dashboard/blog", "routes/dashboard.blog.tsx"),
  route("dashboard/blog/new", "routes/dashboard.blog.new.tsx"),
  route("dashboard/notification-history", "routes/dashboard.notification-history.tsx"),
  route("dashboard/rally-submission", "routes/dashboard.rally-submission.tsx"),
  
  // Zones
  route("zone/:zoneId", "routes/zone.$zoneId.tsx"),
  
  // Check-in
  route("check-in/:participantId", "routes/check-in.$participantId.tsx"),
  
  // Admin
  route("admin", "routes/admin._index.tsx"),
  route("admin/blog", "routes/admin.blog.tsx"),
  route("admin/check-in", "routes/admin.check-in.tsx"),
  route("admin/event-markers", "routes/admin.event-markers.tsx"),
  route("admin/fallback-review", "routes/admin.fallback-review.tsx"),
  route("admin/gallery", "routes/admin.gallery.tsx"),
  route("admin/leaderboard", "routes/admin.leaderboard.tsx"),
  route("admin/manual-scan", "routes/admin.manual-scan.tsx"),
  route("admin/participants", "routes/admin.participants.tsx"),
  route("admin/participants/:participantId/submissions", "routes/admin.participants.$participantId.submissions.tsx"),
  route("admin/pending-scans", "routes/admin.pending-scans.tsx"),
  route("admin/push-notifications", "routes/admin.push-notifications.tsx"),
  route("admin/settings", "routes/admin.settings.tsx"),
  route("admin/submissions", "routes/admin.submissions.tsx"),
  route("admin/zone-control", "routes/admin.zone-control.tsx"),
  route("admin/emergency-alerts", "routes/admin.emergency-alerts.tsx"),
  
  // API
  route("api/check-ins", "routes/api.check-ins.tsx"),
  route("api/event-markers", "routes/api.event-markers.tsx"),
  route("api/events/submit", "routes/api.events.submit.tsx"),
  route("api/gpx-route", "routes/api.gpx-route.tsx"),
  route("api/push-send", "routes/api.push-send.tsx"),
  route("api/push-subscribe", "routes/api.push-subscribe.tsx"),
  route("api/qrcode", "routes/api.qrcode.tsx"),
  route("api/rally-submission", "routes/api.rally-submission.tsx"),
  route("api/rally-zones", "routes/api.rally-zones.tsx"),
  route("api/shadow-recalculate", "routes/api.shadow-recalculate.tsx"),
  route("api/webhook", "routes/api.webhook.tsx"),
  route("api/zone-gpx/:zoneId", "routes/api.zone-gpx.$zoneId.tsx"),
  route("api/emergency-sos", "routes/api.emergency-sos.ts"),
] satisfies RouteConfig;
