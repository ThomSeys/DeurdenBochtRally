import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

export default [
  // ── Public routes (shared nav + footer) ─────────────────────────────────
  layout("layouts/public.tsx", [
    index("routes/home.tsx"),
    route("about", "routes/about.tsx"),
    route("register", "routes/register.tsx"),
    route("login", "routes/login.tsx"),
    route("forgot-password", "routes/forgot-password.tsx"),
    route("profile", "routes/profile.tsx"),
  ]),

  // Logout: action-only, no layout needed
  route("logout", "routes/logout.ts"),

  // ── Protected routes (authenticated app shell) ───────────────────────────
  layout("layouts/protected.tsx", [
    route("rally", "routes/rally.tsx"),
    route("dashboard", "routes/dashboard.tsx"),
    route("choice-points", "routes/choice-points.tsx"),
    route("rider-groups", "routes/rider-groups.tsx"),
    route("leaderboard", "routes/leaderboard.tsx"),
  ]),

  // ── Admin routes (admin role required) ──────────────────────────────────
  layout("layouts/admin.tsx", [
    route("admin", "routes/admin._index.tsx"),
    route("admin/events", "routes/admin.events._index.tsx"),
    route("admin/events/new", "routes/admin.events.new.tsx"),
  ]),
] satisfies RouteConfig;
