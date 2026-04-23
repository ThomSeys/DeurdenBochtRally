import { Form, Link, NavLink, Outlet, redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { serverClient } from "~/lib/supabase.server";
import { getUser } from "@ddb/supabase/services/auth";
import { useLoaderData } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const ctx = serverClient(request);
  const { user } = await getUser(ctx);
  return { user, headers: ctx.headers };
}

// ── Nav link helper ───────────────────────────────────────────────────────────

const navLink = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-orange-500/10 text-orange-400"
      : "text-gray-400 hover:bg-white/5 hover:text-white"
  }`;

export default function PublicLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-surface/80 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-4 py-3">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-orange-500 hover:text-orange-400"
          >
            Deur Den Bocht
          </Link>

          <div className="flex items-center gap-1">
            <NavLink to="/about" className={navLink}>
              About
            </NavLink>

            {user ? (
              // ── Logged-in nav ───────────────────────────────────────────────
              <>
                <NavLink to="/dashboard" className={navLink}>Dashboard</NavLink>
                <NavLink to="/rally" className={navLink}>Route</NavLink>
                <NavLink to="/leaderboard" className={navLink}>Ranking</NavLink>

                {/* User menu */}
                <div className="ml-2 flex items-center gap-1 border-l border-white/10 pl-3">
                  <NavLink
                    to="/profile"
                    className={navLink}
                  >
                    Profile
                  </NavLink>
                  <Form action="/logout" method="post">
                    <button
                      type="submit"
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Logout
                    </button>
                  </Form>
                </div>
              </>
            ) : (
              // ── Guest nav ───────────────────────────────────────────────────
              <>
                <NavLink to="/register" className={navLink}>
                  Register
                </NavLink>
                <NavLink
                  to="/login"
                  className="ml-2 rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
                >
                  Login
                </NavLink>
              </>
            )}
          </div>
        </nav>
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

