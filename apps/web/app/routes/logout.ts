import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { serverClient } from "~/lib/supabase.server";
import { signOut } from "@ddb/supabase/services/auth";

/** Logout — action only, no UI rendered. */
export async function action({ request }: ActionFunctionArgs) {
  const ctx = serverClient(request);
  await signOut(ctx);
  throw redirect("/", { headers: ctx.headers });
}

// GET requests to /logout just redirect home
export async function loader() {
  throw redirect("/");
}
