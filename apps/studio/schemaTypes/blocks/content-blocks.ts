import { defineField, defineType, defineArrayMember } from "sanity";

export const featureStrip = defineType({
  name: "featureStrip",
  title: "Feature strip",
  type: "object",
  fields: [
    defineField({
      name: "items",
      title: "Features",
      type: "array",
      of: [defineArrayMember({ type: "featureItem" })],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "columns",
      title: "Number of columns",
      type: "number",
      options: {
        list: [
          { title: "2", value: 2 },
          { title: "3", value: 3 },
          { title: "4", value: 4 },
        ],
        layout: "radio",
      },
      initialValue: 3,
    }),
    defineField({
      name: "background",
      title: "Background",
      type: "string",
      options: {
        list: [
          { title: "Surface (page background)", value: "surface" },
          { title: "Surface card (slightly lighter)", value: "surface-card" },
          { title: "Transparent", value: "transparent" },
        ],
      },
      initialValue: "surface-card",
    }),
  ],
  preview: {
    select: { items: "items" },
    prepare({ items }: { items?: unknown[] }) {
      return { title: `Feature strip (${items?.length ?? 0} items)` };
    },
  },
});

export const imageText = defineType({
  name: "imageText",
  title: "Image + text",
  type: "object",
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "imagePosition",
      title: "Image position",
      type: "string",
      options: {
        list: [
          { title: "Left", value: "left" },
          { title: "Right", value: "right" },
        ],
        layout: "radio",
      },
      initialValue: "left",
    }),
    defineField({ name: "eyebrow", title: "Eyebrow label", type: "string" }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({ name: "button", title: "CTA button (optional)", type: "ctaButton" }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }: { title?: string }) {
      return { title: `Image + text: ${title}` };
    },
  },
});

export const richText = defineType({
  name: "richText",
  title: "Rich text block",
  type: "object",
  fields: [
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [defineArrayMember({ type: "block" })],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "maxWidth",
      title: "Max width",
      type: "string",
      options: {
        list: [
          { title: "Narrow", value: "narrow" },
          { title: "Normal", value: "normal" },
          { title: "Wide", value: "wide" },
        ],
        layout: "radio",
      },
      initialValue: "normal",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Rich text block" };
    },
  },
});

export const ctaBanner = defineType({
  name: "ctaBanner",
  title: "CTA banner",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "subtitle", title: "Subtitle", type: "string" }),
    defineField({
      name: "button",
      title: "Button",
      type: "ctaButton",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "background",
      title: "Background colour",
      type: "string",
      options: {
        list: [
          { title: "Brand orange", value: "brand" },
          { title: "Dark", value: "dark" },
          { title: "Light", value: "light" },
        ],
        layout: "radio",
      },
      initialValue: "brand",
    }),
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }: { title?: string }) {
      return { title: `CTA banner: ${title}` };
    },
  },
});

export const faq = defineType({
  name: "faq",
  title: "FAQ section",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Section title", type: "string" }),
    defineField({
      name: "items",
      title: "Questions",
      type: "array",
      of: [defineArrayMember({ type: "faqEntry" })],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: { items: "items" },
    prepare({ items }: { items?: unknown[] }) {
      return { title: `FAQ (${items?.length ?? 0} questions)` };
    },
  },
});

export const statsStrip = defineType({
  name: "statsStrip",
  title: "Stats strip",
  type: "object",
  fields: [
    defineField({
      name: "items",
      title: "Stats",
      type: "array",
      of: [defineArrayMember({ type: "statItem" })],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: { items: "items" },
    prepare({ items }: { items?: unknown[] }) {
      return { title: `Stats strip (${items?.length ?? 0} stats)` };
    },
  },
});

export const alertBanner = defineType({
  name: "alertBanner",
  title: "Alert banner",
  type: "object",
  fields: [
    defineField({
      name: "message",
      title: "Message",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "intent",
      title: "Urgency",
      type: "string",
      options: {
        list: [
          { title: "Info", value: "info" },
          { title: "Warning", value: "warning" },
          { title: "Urgent", value: "urgent" },
        ],
        layout: "radio",
      },
      initialValue: "info",
    }),
    defineField({
      name: "link",
      title: "Optional link",
      type: "object",
      fields: [
        defineField({ name: "label", title: "Link label", type: "string" }),
        defineField({ name: "href", title: "URL or path", type: "string" }),
      ],
    }),
    defineField({
      name: "dismissable",
      title: "Dismissable",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "message" },
    prepare({ title }: { title?: string }) {
      return { title: `Alert: ${title}` };
    },
  },
});
