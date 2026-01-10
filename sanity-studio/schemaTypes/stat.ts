import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'stat',
  title: 'Statistic',
  type: 'document',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon (emoji)',
      type: 'string',
      description: 'Gebruik een emoji, bv. 🏍️ 🗺️ 🌍',
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
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'label',
      subtitle: 'value',
      icon: 'icon',
    },
    prepare(selection) {
      const { title, subtitle, icon } = selection;
      return {
        title: `${icon} ${title}`,
        subtitle,
      };
    },
  },
});
