import { defineField, defineType } from "sanity";

export const ctaButton = defineType({
  name: "ctaButton",
  title: "CTA Button",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "href",
      title: "URL or path",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "intent",
      title: "Style",
      type: "string",
      options: {
        list: [
          { title: "Primary (orange)", value: "primary" },
          { title: "Secondary (outlined)", value: "secondary" },
          { title: "Ghost (text only)", value: "ghost" },
        ],
        layout: "radio",
      },
      initialValue: "primary",
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "href" },
  },
});
