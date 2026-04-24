import { defineField, defineType, defineArrayMember } from "sanity";

export const hero = defineType({
  name: "hero",
  title: "Hero",
  type: "object",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow label", type: "string" }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "subtitle", title: "Subtitle", type: "text", rows: 2 }),
    defineField({
      name: "buttons",
      title: "CTA Buttons",
      type: "array",
      of: [defineArrayMember({ type: "ctaButton" })],
      validation: (Rule) => Rule.max(2),
    }),
    defineField({
      name: "backgroundType",
      title: "Background type",
      type: "string",
      options: {
        list: [
          { title: "Image", value: "image" },
          { title: "Video", value: "video" },
        ],
        layout: "radio",
      },
      initialValue: "image",
    }),
    defineField({
      name: "backgroundImage",
      title: "Background image",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
    }),
    defineField({
      name: "backgroundVideoFile",
      title: "Background video (upload)",
      type: "file",
      options: { accept: "video/*" },
    }),
    defineField({
      name: "backgroundVideoUrl",
      title: "Background video (embed URL)",
      type: "url",
      description: "YouTube or Vimeo URL — used when no file is uploaded",
    }),
    defineField({
      name: "overlayOpacity",
      title: "Overlay opacity (0–100)",
      type: "number",
      initialValue: 50,
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: "alignment",
      title: "Text alignment",
      type: "string",
      options: {
        list: [
          { title: "Left", value: "left" },
          { title: "Center", value: "center" },
          { title: "Right", value: "right" },
        ],
        layout: "radio",
      },
      initialValue: "center",
    }),
    defineField({
      name: "minHeight",
      title: "Minimum height",
      type: "string",
      options: {
        list: [
          { title: "Small", value: "sm" },
          { title: "Medium", value: "md" },
          { title: "Large", value: "lg" },
          { title: "Full screen", value: "full" },
        ],
      },
      initialValue: "full",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "subtitle" },
    prepare({ title, subtitle }) {
      return { title: `Hero: ${title}`, subtitle };
    },
  },
});
