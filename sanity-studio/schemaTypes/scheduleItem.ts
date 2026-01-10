import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'scheduleItem',
  title: 'Schedule Item',
  type: 'document',
  fields: [
    defineField({
      name: 'time',
      title: 'Time',
      type: 'string',
      description: 'e.g., "06:30 - 08:00"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon (emoji)',
      type: 'string',
      description: 'Emoji to display',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'color',
      title: 'Border Color',
      type: 'string',
      options: {
        list: [
          { title: 'Primary', value: 'primary' },
          { title: 'Blue', value: 'blue' },
          { title: 'Green', value: 'green' },
          { title: 'Yellow', value: 'yellow' },
          { title: 'Red', value: 'red' },
        ],
      },
      initialValue: 'primary',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'details',
      title: 'Additional Details',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Bullet points with additional details',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      validation: (Rule) => Rule.required(),
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
      title: 'title',
      time: 'time',
      order: 'order',
    },
    prepare(selection) {
      const { title, time, order } = selection;
      return {
        title: `${order}. ${title}`,
        subtitle: time,
      };
    },
  },
});
