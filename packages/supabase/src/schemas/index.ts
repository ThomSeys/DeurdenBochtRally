import { z } from "zod";

// ── Reusable field primitives ─────────────────────────────────────────────────

const email = z.string().trim().email("Enter a valid email address.");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.");

const phone = z
  .string()
  .trim()
  .regex(/^[\d\s\+\-\(\)]{7,20}$/, "Enter a valid phone number.")
  .optional()
  .or(z.literal("").transform(() => undefined));

const year = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z
    .number()
    .int()
    .min(1900, "Year must be 1900 or later.")
    .max(2030, "Year must be 2030 or earlier.")
    .optional(),
);

const optionalText = z
  .string()
  .trim()
  .optional()
  .or(z.literal("").transform(() => undefined));

// ── Enums ─────────────────────────────────────────────────────────────────────

export const MotorcycleCategorySchema = z.enum([
  "adventure",
  "naked",
  "sport",
  "touring",
  "enduro",
  "custom",
  "other",
]);

export const EventTypeSchema = z.enum(["adventurous", "trailblazer"]);

// ── Register schema ───────────────────────────────────────────────────────────

export const RegisterSchema = z
  .object({
    // personal
    first_name: z.string().trim().min(1, "First name is required."),
    last_name: z.string().trim().min(1, "Last name is required."),
    email,
    phone,
    // emergency contact
    emergency_name: optionalText,
    emergency_phone: phone,
    // motorcycle
    motorcycle_brand: optionalText,
    motorcycle_model: optionalText,
    motorcycle_year: year,
    motorcycle_category: MotorcycleCategorySchema.default("other"),
    license_plate: optionalText,
    // event
    event_choice: EventTypeSchema,
    // account
    password,
    confirm_password: z.string().min(1, "Please confirm your password."),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

// ── Login schema ──────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required."),
  redirectTo: z.string().optional().default("/dashboard"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ── Event schemas ─────────────────────────────────────────────────────────────

const isoDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date (YYYY-MM-DD).");

const optionalDatetime = z
  .string()
  .trim()
  .optional()
  .or(z.literal("").transform(() => undefined));

export const CreateEventSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens."),
  event_date: isoDate,
  registration_opens_at: optionalDatetime,
  registration_closes_at: optionalDatetime,
  is_active: z.preprocess((v) => v === "true" || v === true || v === "on", z.boolean()).default(false),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
