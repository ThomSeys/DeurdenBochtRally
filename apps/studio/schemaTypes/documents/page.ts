import { defineField, defineType, defineArrayMember } from "sanity";

export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Page title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: 'Use "home" for the homepage, "about" for the about page.',
      options: { source: "title" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "blocks",
      title: "Content blocks",
      type: "array",
      of: [
        defineArrayMember({ type: "hero" }),
        defineArrayMember({ type: "featureStrip" }),
        defineArrayMember({ type: "imageText" }),
        defineArrayMember({ type: "richText" }),
        defineArrayMember({ type: "ctaBanner" }),
        defineArrayMember({ type: "faq" }),
        defineArrayMember({ type: "statsStrip" }),
        defineArrayMember({ type: "alertBanner" }),
      ],
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      fields: [
        defineField({ name: "title", title: "Meta title", type: "string" }),
        defineField({
          name: "description",
          title: "Meta description",
          type: "text",
          rows: 2,
        }),
        defineField({
          name: "ogImage",
          title: "Social share image",
          type: "image",
          options: { hotspot: true },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: "title", slug: "slug" },
    prepare({ title, slug }: { title?: string; slug?: { current?: string } }) {
      return { title, subtitle: `/${slug?.current ?? ""}` };
    },
  },
});
