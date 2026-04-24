import { Link, Outlet, redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { serverClient } from "~/lib/supabase.server";
import { getUser, isAdmin as checkIsAdmin } from "@ddb/supabase/services/auth";
import { useLoaderData } from "react-router";
import { NavMenu } from "~/components/NavMenu";

export async function loader({ request }: LoaderFunctionArgs) {
  const ctx = serverClient(request);
  const { user } = await getUser(ctx);
  return { user, isAdmin: user ? checkIsAdmin(user) : false, headers: ctx.headers };
}

const guestItems = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/register", label: "Register" },
];

const userItems = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/rally", label: "Route" },
  { to: "/leaderboard", label: "Ranking" },
];

export default function PublicLayout() {
  const { user, isAdmin } = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed w-full top-0 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-orange-500 hover:text-orange-400"
          >
            Deur Den Bocht
          </Link>

          <NavMenu
            items={user ? userItems : guestItems}
            user={user ? { email: user.email, displayName: user.user_metadata?.full_name } : undefined}
            isAdmin={isAdmin}
          />
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Deur Den Bocht. All rights reserved.
      </footer>
    </div>
  );
}


