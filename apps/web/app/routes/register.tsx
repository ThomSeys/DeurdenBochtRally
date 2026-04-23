import { Form, redirect, useActionData, useNavigation } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { tv } from "tailwind-variants";
import { adminClient, serverClient } from "~/lib/supabase.server";
import { getUser } from "@ddb/supabase/services/auth";
import { Input } from "~/components/ui/Input";
import { Select } from "~/components/ui/Select";
import { Button } from "~/components/ui/Button";
import { Alert } from "~/components/ui/Alert";
import { TextLink } from "~/components/ui/TextLink";
import { PageHeading } from "~/components/ui/PageHeading";
import { SectionHeading } from "~/components/ui/SectionHeading";
import { registerParticipant } from "@ddb/supabase/services/participant";
import { signIn } from "@ddb/supabase/services/auth";
import { RegisterSchema } from "@ddb/supabase/schemas";
import { formDataToObject, zodErrors } from "~/lib/zod";

export const meta: MetaFunction = () => [
  { title: "Register – Deur Den Bocht" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const ctx = serverClient(request);
  const { user } = await getUser(ctx);
  if (user) throw redirect("/dashboard", { headers: ctx.headers });
  return null;
}

// ── Server action ─────────────────────────────────────────────────────────────

export async function action({ request }: ActionFunctionArgs) {
  const fd = await request.formData();

  // ── Zod validation ──────────────────────────────────────────────────────────
  const parsed = RegisterSchema.safeParse(formDataToObject(fd));

  if (!parsed.success) {
    return { fieldErrors: zodErrors(parsed.error), error: null };
  }

  const d = parsed.data;

  // ── Registration ────────────────────────────────────────────────────────────
  const admin = adminClient();
  const ctx = serverClient(request);

  const { error: regError } = await registerParticipant(admin, ctx, {
    email: d.email,
    password: d.password,
    firstName: d.first_name,
    lastName: d.last_name,
    phone: d.phone,
    emergencyName: d.emergency_name,
    emergencyPhone: d.emergency_phone,
    motorcycleBrand: d.motorcycle_brand,
    motorcycleModel: d.motorcycle_model,
    motorcycleYear: d.motorcycle_year,
    motorcycleCategory: d.motorcycle_category,
    licensePlate: d.license_plate,
    eventChoice: d.event_choice,
  });

  if (regError) return { error: regError, fieldErrors: null };

  // ── Sign in immediately ─────────────────────────────────────────────────────
  const { error: signInError } = await signIn(ctx, {
    email: d.email,
    password: d.password,
  });

  if (signInError) throw redirect("/login?registered=1");

  throw redirect("/dashboard", { headers: ctx.headers });
}

// ── Local styles (radio card — register-specific) ─────────────────────────────

const radioCard = tv({
  slots: {
    root: "flex cursor-pointer gap-3 rounded-xl border border-white/10 p-4 transition-colors has-[:checked]:border-orange-500 has-[:checked]:bg-orange-500/10",
    radio: "mt-0.5 accent-orange-500",
    content: "flex flex-col gap-0.5",
    label: "font-semibold text-white",
    description: "text-xs text-gray-400",
  },
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function Register() {
  const data = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const fe = data?.fieldErrors ?? {};
  const rc = radioCard();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <PageHeading
        title="Register"
        subtitle={
          <>
            Already have an account?{" "}
            <TextLink to="/login">Log in</TextLink>
          </>
        }
      />

      <Form method="post" className="flex flex-col gap-8">
        {data?.error && <Alert>{data.error}</Alert>}

        {/* ── Personal information ─────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Personal information</SectionHeading>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              name="first_name"
              type="text"
              required
              autoComplete="given-name"
              error={fe["first_name"]}
              placeholder="Jan"
            />
            <Input
              label="Last name"
              name="last_name"
              type="text"
              required
              autoComplete="family-name"
              error={fe["last_name"]}
              placeholder="Janssen"
            />
          </div>

          <Input
            label="Email address"
            name="email"
            type="email"
            required
            autoComplete="email"
            error={fe["email"]}
            placeholder="jan@example.com"
          />

          <Input
            label="Phone number"
            name="phone"
            type="tel"
            autoComplete="tel"
            error={fe["phone"]}
            placeholder="+32 477 00 00 00"
          />
        </section>

        {/* ── Emergency contact ────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Emergency contact</SectionHeading>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Contact name"
              name="emergency_name"
              type="text"
              autoComplete="off"
              error={fe["emergency_name"]}
              placeholder="Marie Janssen"
            />
            <Input
              label="Contact phone"
              name="emergency_phone"
              type="tel"
              autoComplete="off"
              error={fe["emergency_phone"]}
              placeholder="+32 477 00 00 00"
            />
          </div>
        </section>

        {/* ── Motorcycle ───────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Motorcycle</SectionHeading>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Brand"
              name="motorcycle_brand"
              type="text"
              placeholder="BMW"
            />
            <Input
              label="Model"
              name="motorcycle_model"
              type="text"
              placeholder="R 1250 GS"
            />
            <Input
              label="Year"
              name="motorcycle_year"
              type="number"
              min={1900}
              max={2030}
              error={fe["motorcycle_year"]}
              placeholder="2024"
            />
            <Input
              label="License plate"
              name="license_plate"
              type="text"
              placeholder="1-ABC-234"
            />
          </div>

          <Select
            label="Category"
            name="motorcycle_category"
            defaultValue="adventure"
          >
            <option value="adventure">Adventure</option>
            <option value="naked">Naked</option>
            <option value="sport">Sport</option>
            <option value="touring">Touring</option>
            <option value="enduro">Enduro</option>
            <option value="custom">Custom</option>
            <option value="other">Other</option>
          </Select>
        </section>

        {/* ── Event choice ─────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Event choice</SectionHeading>
          <p className="text-sm text-gray-500">
            Choose your route. You can always ask the organisation for details.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                value: "adventurous",
                label: "Adventurous",
                description: "Longer route with more rally zones and maximum points.",
              },
              {
                value: "trailblazer",
                label: "Trailblazer",
                description: "Shorter route with curated choice points — great for first-timers.",
              },
            ].map(({ value, label, description }) => (
              <label key={value} className={rc.root()}>
                <input
                  type="radio"
                  name="event_choice"
                  value={value}
                  className={rc.radio()}
                />
                <span className={rc.content()}>
                  <span className={rc.label()}>{label}</span>
                  <span className={rc.description()}>{description}</span>
                </span>
              </label>
            ))}
          </div>
          {fe["event_choice"] && (
            <span className="text-xs text-red-500">{fe["event_choice"]}</span>
          )}
        </section>

        {/* ── Account ──────────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Account</SectionHeading>

          <Input
            label="Password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            error={fe["password"]}
            placeholder="Min. 8 characters"
          />

          <Input
            label="Confirm password"
            name="confirm_password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            error={fe["confirm_password"]}
            placeholder="Repeat your password"
          />
        </section>

        <Button type="submit" disabled={submitting} full size="lg">
          {submitting ? "Registering…" : "Register"}
        </Button>
      </Form>
    </div>
  );
}

