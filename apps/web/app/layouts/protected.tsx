import { Form, NavLink, Outlet, redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import type { ComponentType } from "react";
import { tv } from "tailwind-variants";
import { serverClient } from "~/lib/supabase.server";
import { getUser } from "@ddb/supabase/services/auth";
import { Button } from "~/components/ui/Button";

export async function loader({ request }: LoaderFunctionArgs) {
  const ctx = serverClient(request);
  const { user } = await getUser(ctx);

  if (!user) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname)}`, {
      headers: ctx.headers,
    });
  }

  return { user };
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconRoute = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" />
    <path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-8a3.5 3.5 0 0 1 0-7H12" />
  </svg>
);

const IconFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const IconFork = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M16 3h5v5" /><path d="M8 3H3v5" />
    <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
    <path d="m15 9 6-6" />
  </svg>
);

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconTrophy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

// ── Nav items ─────────────────────────────────────────────────────────────────

type NavItem = { to: string; label: string; Icon: ComponentType };

const navItems: NavItem[] = [
  { to: "/rally", label: "Route", Icon: IconRoute },
  { to: "/dashboard", label: "Dashboard", Icon: IconFlag },
  { to: "/choice-points", label: "Forks", Icon: IconFork },
  { to: "/rider-groups", label: "Groups", Icon: IconUsers },
  { to: "/leaderboard", label: "Ranking", Icon: IconTrophy },
];

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

const mobileNavStyles = tv({
  base: "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium leading-tight transition-colors",
  variants: {
    active: {
      true: "text-orange-500",
      false: "text-gray-500",
    },
  },
  defaultVariants: { active: false },
});

export default function ProtectedLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top app bar */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-lg font-bold tracking-tight text-orange-500">
            Deur Den Bocht
          </span>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => navLinkStyles({ active: isActive })}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <Form action="/logout" method="post">
            <Button type="submit" intent="secondary" size="sm">
              Logout
            </Button>
          </Form>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-white/10 bg-surface-card md:hidden">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => mobileNavStyles({ active: isActive })}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
       
