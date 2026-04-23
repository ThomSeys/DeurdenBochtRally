import { Form, redirect, useActionData, useNavigation, useSearchParams } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { serverClient } from "~/lib/supabase.server";
import { getUser, signIn } from "@ddb/supabase/services/auth";
import { LoginSchema } from "@ddb/supabase/schemas";
import { formDataToObject, zodErrors } from "~/lib/zod";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { Alert } from "~/components/ui/Alert";
import { TextLink } from "~/components/ui/TextLink";
import { PageHeading } from "~/components/ui/PageHeading";

export const meta: MetaFunction = () => [
  { title: "Login – Deur Den Bocht" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const ctx = serverClient(request);
  const { user } = await getUser(ctx);
  if (user) throw redirect("/dashboard", { headers: ctx.headers });
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const fd = await request.formData();

  // ── Zod validation ──────────────────────────────────────────────────────────
  const parsed = LoginSchema.safeParse(formDataToObject(fd));

  if (!parsed.success) {
    return { fieldErrors: zodErrors(parsed.error), error: null };
  }

  const { email, password, redirectTo } = parsed.data;

  const ctx = serverClient(request);
  const { error, user } = await signIn(ctx, { email, password });

  if (error || !user) {
    return { fieldErrors: null, error: error ?? "Invalid email or password." };
  }

  throw redirect(redirectTo, { headers: ctx.headers });
}

export default function Login() {
  const data = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const [params] = useSearchParams();
  const registered = params.get("registered") === "1";
  const redirectTo = params.get("redirectTo") ?? "/dashboard";
  const fe = data?.fieldErrors ?? {};

  return (
    <div className="flex min-h-[calc(100svh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <PageHeading
          title="Welcome back"
          subtitle={
            <>
              No account yet?{" "}
              <TextLink to="/register">Register</TextLink>
            </>
          }
        />

        {registered && (
          <Alert intent="success" className="mb-4">
            Account created! You can now log in.
          </Alert>
        )}

        <Form method="post" className="flex flex-col gap-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          {data?.error && <Alert>{data.error}</Alert>}

          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            error={fe["email"]}
            placeholder="jan@example.com"
          />

          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            error={fe["password"]}
            placeholder="••••••••"
          />

          <div className="flex justify-end">
            <TextLink to="/forgot-password" intent="muted">
              Forgot password?
            </TextLink>
          </div>

          <Button type="submit" disabled={submitting} full>
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </Form>
      </div>
    </div>
  );
}

