import { Form, useActionData } from "react-router";
import type { ActionFunctionArgs, MetaFunction } from "react-router";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { Alert } from "~/components/ui/Alert";
import { TextLink } from "~/components/ui/TextLink";
import { PageHeading } from "~/components/ui/PageHeading";

export const meta: MetaFunction = () => [
  { title: "Forgot password – Deur Den Bocht" },
];

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");

  if (!email) {
    return { error: "Email is required.", sent: false };
  }

  // TODO: send Supabase password reset email
  // await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${APP_URL}/reset-password` });

  return { sent: true, error: null };
}

export default function ForgotPassword() {
  const data = useActionData<typeof action>();

  return (
    <div className="flex min-h-[calc(100svh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <PageHeading
          title="Reset password"
          subtitle="Enter your email and we'll send you a link to reset your password."
        />

        {data?.sent ? (
          <Alert intent="success">
            Check your inbox — a reset link is on its way.{" "}
            <TextLink to="/login" className="underline">
              Back to login
            </TextLink>
          </Alert>
        ) : (
          <Form method="post" className="flex flex-col gap-4">
            {data?.error && <Alert>{data.error}</Alert>}

            <Input
              label="Email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="jan@example.com"
            />

            <Button type="submit" full>
              Send reset link
            </Button>

            <TextLink to="/login" intent="muted" className="text-center">
              Back to login
            </TextLink>
          </Form>
        )}
      </div>
    </div>
  );
}
