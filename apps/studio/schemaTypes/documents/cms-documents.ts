import { defineField, defineType, defineArrayMember } from "sanity";

export const edition = defineType({
  name: "edition",
  title: "Event Edition",
  type: "document",
  fields: [
    defineField({ name: "year", title: "Year", type: "number", validation: (Rule) => Rule.required() }),
    defineField({ name: "name", title: "Edition name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "eventDate", title: "Event date", type: "datetime" }),
    defineField({ name: "isActive", title: "Active edition", type: "boolean", initialValue: false }),
    defineField({ name: "registrationOpen", title: "Registration open", type: "boolean", initialValue: false }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
  ],
  preview: {
    select: { title: "name", subtitle: "year" },
  },
});

export const sponsor = defineType({
  name: "sponsor",
  title: "Sponsor",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "logo", title: "Logo", type: "image", options: { hotspot: true } }),
    defineField({ name: "url", title: "Website URL", type: "url" }),
    defineField({
      name: "tier",
      title: "Tier",
      type: "string",
      options: { list: ["gold", "silver", "bronze", "partner"] },
    }),
    defineField({ name: "edition", title: "Edition", type: "reference", to: [{ type: "edition" }] }),
  ],
  preview: {
    select: { title: "name", subtitle: "tier" },
  },
});

export const siteConfig = defineType({
  name: "siteConfig",
  title: "Site Configuration",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Site title", type: "string" }),
    defineField({ name: "description", title: "Site description", type: "text", rows: 2 }),
    defineField({ name: "logo", title: "Logo", type: "image", options: { hotspot: true } }),
    defineField({ name: "ogImage", title: "Default OG image", type: "image", options: { hotspot: true } }),
    defineField({ name: "primaryColor", title: "Primary color", type: "string" }),
    defineField({
      name: "socialLinks",
      title: "Social links",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "platform", type: "string", title: "Platform" }),
            defineField({ name: "url", type: "url", title: "URL" }),
          ],
        }),
      ],
    }),
    defineField({ name: "contactEmail", title: "Contact email", type: "string" }),
    defineField({ name: "edition", title: "Active edition", type: "reference", to: [{ type: "edition" }] }),
  ],
  preview: {
    select: { title: "title" },
  },
});

export const scheduleItem = defineType({
  name: "scheduleItem",
  title: "Schedule Item",
  type: "document",
  fields: [
    defineField({ name: "time", title: "Time", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "title", title: "Title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
    defineField({ name: "location", title: "Location", type: "string" }),
    defineField({ name: "order", title: "Display order", type: "number" }),
    defineField({ name: "isHighlight", title: "Highlight", type: "boolean", initialValue: false }),
    defineField({ name: "edition", title: "Edition", type: "reference", to: [{ type: "edition" }] }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: { list: ["briefing", "start", "checkpoint", "end", "social", "other"] },
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "time" },
  },
});

export const faqItem = defineType({
  name: "faqItem",
  title: "FAQ Item",
  type: "document",
  fields: [
    defineField({ name: "question", title: "Question", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "answer",
      title: "Answer",
      type: "array",
      of: [defineArrayMember({ type: "block" })],
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "category", title: "Category", type: "string" }),
    defineField({ name: "order", title: "Display order", type: "number" }),
    defineField({ name: "edition", title: "Edition", type: "reference", to: [{ type: "edition" }] }),
    defineField({ name: "isPublished", title: "Published", type: "boolean", initialValue: true }),
  ],
  preview: {
    select: { title: "question" },
  },
});

export const pricingTier = defineType({
  name: "pricingTier",
  title: "Pricing Tier",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "price", title: "Price (€)", type: "number", validation: (Rule) => Rule.required() }),
    defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
    defineField({
      name: "features",
      title: "Features",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({ name: "isPopular", title: "Highlighted", type: "boolean", initialValue: false }),
    defineField({ name: "edition", title: "Edition", type: "reference", to: [{ type: "edition" }] }),
    defineField({ name: "stripePriceId", title: "Stripe price ID", type: "string" }),
  ],
  preview: {
    select: { title: "name", subtitle: "price" },
  },
});

export const benefitItem = defineType({
  name: "benefitItem",
  title: "Benefit Item",
  type: "document",
  fields: [
    defineField({ name: "icon", title: "Icon name", type: "string" }),
    defineField({ name: "title", title: "Title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "description", title: "Description", type: "text", rows: 2 }),
    defineField({ name: "order", title: "Display order", type: "number" }),
    defineField({ name: "edition", title: "Edition", type: "reference", to: [{ type: "edition" }] }),
    defineField({ name: "tier", title: "Available from tier", type: "string" }),
  ],
  preview: {
    select: { title: "title" },
  },
});

export const featureCard = defineType({
  name: "featureCard",
  title: "Feature Card",
  type: "document",
  fields: [
    defineField({ name: "icon", title: "Icon name", type: "string" }),
    defineField({ name: "title", title: "Title", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "body", title: "Body", type: "text", rows: 2 }),
    defineField({ name: "order", title: "Display order", type: "number" }),
    defineField({ name: "edition", title: "Edition", type: "reference", to: [{ type: "edition" }] }),
    defineField({ name: "isPublished", title: "Published", type: "boolean", initialValue: true }),
  ],
  preview: {
    select: { title: "title" },
  },
});
