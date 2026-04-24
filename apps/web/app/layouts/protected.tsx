import { Link, Outlet, redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { serverClient } from "~/lib/supabase.server";
import { getUser, isAdmin as checkIsAdmin } from "@ddb/supabase/services/auth";
import { useLoaderData } from "react-router";
import { NavMenu } from "~/components/NavMenu";

export async function loader({ request }: LoaderFunctionArgs) {
  const ctx = serverClient(request);
  const { user } = await getUser(ctx);

  if (!user) {
    const url = new URL(request.url);
    throw redirect(`/login?redirectTo=${encodeURIComponent(url.pathname)}`, {
      headers: ctx.headers,
    });
  }

  return { user, isAdmin: checkIsAdmin(user) };
}

const navItems = [
  { to: "/rally", label: "Route" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/choice-points", label: "Forks" },
  { to: "/rider-groups", label: "Groups" },
  { to: "/leaderboard", label: "Ranking" },
];

export default function ProtectedLayout() {
  const { user, isAdmin } = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed w-full top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-orange-500 hover:text-orange-400"
          >
            Deur Den Bocht
          </Link>

          <NavMenu
            items={navItems}
            user={{ email: user.email, displayName: user.user_metadata?.full_name }}
            isAdmin={isAdmin}
          />
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

