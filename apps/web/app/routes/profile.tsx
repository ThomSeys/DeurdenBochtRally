import { redirect } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { serverClient } from "~/lib/supabase.server";
import { getUser } from "@ddb/supabase/services/auth";
import { PageHeading } from "~/components/ui/PageHeading";

export const meta: MetaFunction = () => [
  { title: "Profile – Deur Den Bocht" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const ctx = serverClient(request);
  const { user } = await getUser(ctx);
  if (!user) throw redirect("/login", { headers: ctx.headers });
  return { email: user.email ?? "", name: user.user_metadata?.["full_name"] ?? "" };
}

export default function Profile() {
  const { email, name } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <PageHeading title="Profile" subtitle="Your account details." />
      <div className="mt-6 rounded-xl border border-white/10 bg-surface-card p-6 space-y-4">
        {name && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Name</p>
            <p className="mt-1 text-white">{name}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Email</p>
          <p className="mt-1 text-white">{email}</p>
        </div>
      </div>
    </div>
  );
}
