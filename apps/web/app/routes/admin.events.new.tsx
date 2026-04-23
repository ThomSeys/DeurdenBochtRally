import { Form, redirect, useActionData, useNavigation } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { adminClient } from "~/lib/supabase.server";
import { createEvent } from "@ddb/supabase/services/event";
import { CreateEventSchema } from "@ddb/supabase/schemas";
import { formDataToObject, zodErrors } from "~/lib/zod";
import { PageHeading } from "~/components/ui/PageHeading";
import { SectionHeading } from "~/components/ui/SectionHeading";
import { Input } from "~/components/ui/Input";
import { Button } from "~/components/ui/Button";
import { Alert } from "~/components/ui/Alert";
import { TextLink } from "~/components/ui/TextLink";

export async function action({ request }: ActionFunctionArgs) {
  const fd = await request.formData();

  const parsed = CreateEventSchema.safeParse(formDataToObject(fd));
  if (!parsed.success) {
    return { fieldErrors: zodErrors(parsed.error), error: null };
  }

  const admin = adminClient();
  const { event, error } = await createEvent(admin, parsed.data);

  if (error) return { error, fieldErrors: null };

  throw redirect(`/admin/events`);
}

export default function AdminEventsNew() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isPending = navigation.state !== "idle";

  const fieldErrors = actionData?.fieldErrors ?? {};
  const error = actionData?.error;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TextLink to="/admin/events" intent="muted">
          ← Events
        </TextLink>
      </div>

      <PageHeading title="New Event" subtitle="Create a new edition of Deur Den Bocht." />

      {error && <Alert intent="error">{error}</Alert>}

      <Form method="post" className="max-w-lg space-y-8">
        {/* Basic info */}
        <section className="space-y-4">
          <SectionHeading>Basic info</SectionHeading>

          <Input
            label="Event name"
            name="name"
            placeholder="Deur Den Bocht 2027"
            required
            error={fieldErrors["name"]}
          />

          <Input
            label="Slug"
            name="slug"
            placeholder="2027"
            required
            error={fieldErrors["slug"]}
          />

          <Input
            label="Event date"
            name="event_date"
            type="date"
            required
            error={fieldErrors["event_date"]}
          />
        </section>

        {/* Registration window */}
        <section className="space-y-4">
          <SectionHeading>Registration window (optional)</SectionHeading>

          <Input
            label="Registration opens at"
            name="registration_opens_at"
            type="datetime-local"
            error={fieldErrors["registration_opens_at"]}
          />

          <Input
            label="Registration closes at"
            name="registration_closes_at"
            type="datetime-local"
            error={fieldErrors["registration_closes_at"]}
          />
        </section>

        {/* Activation */}
        <section className="space-y-3">
          <SectionHeading>Activation</SectionHeading>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              value="true"
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">
              Set as active event{" "}
              <span className="text-gray-400">(deactivates all others)</span>
            </span>
          </label>
        </section>

        <Button type="submit" intent="primary" full disabled={isPending}>
          {isPending ? "Creating…" : "Create event"}
        </Button>
      </Form>
    </div>
  );
}
