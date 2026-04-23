import { NavLink, Outlet, redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { tv } from "tailwind-variants";
import { serverClient } from "~/lib/supabase.server";
import { getUser, isAdmin } from "@ddb/supabase/services/auth";

export async function loader({ request }: LoaderFunctionArgs) {
  const ctx = serverClient(request);
  const { user } = await getUser(ctx);

  if (!user) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname)}`, {
      headers: ctx.headers,
    });
  }

  if (!isAdmin(user)) {
    throw redirect("/dashboard", { headers: ctx.headers });
  }

  return { user };
}

const navItems = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/events", label: "Events" },
] as const;

const navLinkStyles = tv({
  base: "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
  variants: {
    active: {
      true: "bg-orange-500/10 text-orange-400",
      false: "text-gray-400 hover:bg-white/5 hover:text-white",
    },
  },
  defaultVariants: { active: false },
});

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight text-orange-500">
              Deur Den Bocht
            </span>
            <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-orange-400">
              Admin
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item ? item.end : false}
                className={({ isActive }) =>
                  navLinkStyles({ active: isActive })
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <NavLink
            to="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to app
          </NavLink>
        </div>

        {/* Mobile nav */}
        <nav className="flex border-t border-white/10 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={"end" in item ? item.end : false}
              className={({ isActive }) =>
                `flex-1 py-2 text-center text-xs font-medium transition-colors ${
                  isActive ? "text-orange-500" : "text-gray-500"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
