import { Link, Outlet, redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { serverClient } from "~/lib/supabase.server";
import { getUser, isAdmin } from "@ddb/supabase/services/auth";
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

  if (!isAdmin(user)) {
    throw redirect("/dashboard", { headers: ctx.headers });
  }

  return { user };
}

const navItems = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/events", label: "Events" },
];

const extraLinks = [{ to: "/dashboard", label: "← Back to app" }];

export default function AdminLayout() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed w-full top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-lg font-bold tracking-tight text-orange-500 hover:text-orange-400"
            >
              Deur Den Bocht
            </Link>
            <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-orange-400">
              Admin
            </span>
          </div>

          <NavMenu
            items={navItems}
            user={{ email: user.email, displayName: user.user_metadata?.full_name }}
            isAdmin={true}
            extraLinks={extraLinks}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

