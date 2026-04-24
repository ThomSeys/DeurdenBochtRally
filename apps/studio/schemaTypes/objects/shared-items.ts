import { defineField, defineType, defineArrayMember } from "sanity";

export const featureItem = defineType({
  name: "featureItem",
  title: "Feature item",
  type: "object",
  fields: [
    defineField({ name: "icon", title: "Icon name", type: "string" }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "body", title: "Body text", type: "text", rows: 2 }),
  ],
  preview: {
    select: { title: "title", subtitle: "body" },
  },
});

export const statItem = defineType({
  name: "statItem",
  title: "Stat item",
  type: "object",
  fields: [
    defineField({
      name: "value",
      title: "Value",
      type: "string",
      description: 'e.g. "286 km" or "50+"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      description: 'e.g. "Master route"',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "value", subtitle: "label" },
  },
});

export const faqEntry = defineType({
  name: "faqEntry",
  title: "FAQ item",
  type: "object",
  fields: [
    defineField({
      name: "question",
      title: "Question",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "answer",
      title: "Answer",
      type: "array",
      of: [defineArrayMember({ type: "block" })],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "question" },
  },
});
