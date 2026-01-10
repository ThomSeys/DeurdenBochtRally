import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'pageContent',
  title: 'Page Content',
  type: 'document',
  fields: [
    defineField({
      name: 'page',
      title: 'Page',
      type: 'string',
      options: {
        list: [
          { title: 'Homepage', value: 'homepage' },
          { title: 'About', value: 'about' },
          { title: 'Rally', value: 'rally' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'section',
      title: 'Section',
      type: 'string',
      description: 'Unique identifier for this section (e.g., "what-is-it", "schedule")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Rich text content for this section',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'edition',
      title: 'Edition',
      type: 'reference',
      to: [{ type: 'edition' }],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      page: 'page',
      section: 'section',
    },
    prepare(selection) {
      const { title, page, section } = selection;
      return {
        title,
        subtitle: `${page} - ${section}`,
      };
    },
  },
});
