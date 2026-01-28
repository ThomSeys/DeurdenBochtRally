import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'featureCard',
  title: 'Feature Card',
  type: 'document',
  fields: [
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
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon Name',
      type: 'string',
      description: 'Icon name from lucide-react (e.g., map, book, camera, trophy, users, etc.)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'edition',
      title: 'Edition',
      type: 'reference',
      to: [{ type: 'edition' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'section',
      title: 'Section',
      type: 'string',
      description: 'Which section this card belongs to (e.g., rally-features)',
      options: {
        list: [
          { title: 'Rally Features', value: 'rally-features' },
          { title: 'Homepage Features', value: 'homepage-features' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
      icon: 'icon',
    },
    prepare({ title, subtitle, icon }) {
      return {
        title,
        subtitle: `${icon} - ${subtitle?.substring(0, 50)}...`,
      };
    },
  },
});
