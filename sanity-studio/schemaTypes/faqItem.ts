import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'faqItem',
  title: 'FAQ Item',
  type: 'document',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'General', value: 'general' },
          { title: 'Safety', value: 'safety' },
          { title: 'Rally', value: 'rally' },
          { title: 'Cancellation', value: 'cancellation' },
          { title: 'Important', value: 'important' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon (emoji)',
      type: 'string',
      description: 'Optional emoji icon',
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
  orderings: [
    {
      title: 'Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'question',
      category: 'category',
      order: 'order',
    },
    prepare(selection) {
      const { title, category, order } = selection;
      return {
        title,
        subtitle: `${category} (${order})`,
      };
    },
  },
});
